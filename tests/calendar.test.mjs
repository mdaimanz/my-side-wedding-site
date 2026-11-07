import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loadSource(relativePath, mocks = {}) {
  const filename = new URL(`../${relativePath}`, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  const loaded = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(name), loaded, loaded.exports,
  );
  return loaded.exports;
}

const calendar = loadSource("src/lib/calendar.ts");
const { wedding } = loadSource("src/data/wedding.ts");
const now = new Date("2026-11-07T10:00:00Z");
const unfold = (value) => value.replace(/\r\n /g, "");

test("Google event uses the wedding data and Malaysia's evening times in UTC", () => {
  const url = new URL(calendar.googleCalendarUrl(wedding));
  assert.equal(url.origin, "https://calendar.google.com");
  assert.equal(url.searchParams.get("action"), "TEMPLATE");
  assert.equal(url.searchParams.get("text"), "Walimatul Urus Aiman & Atiqah");
  assert.equal(url.searchParams.get("dates"), "20270101T103000Z/20270101T143000Z");
  assert.equal(url.searchParams.get("ctz"), "Asia/Kuala_Lumpur");
  assert.equal(url.searchParams.get("location"), `${wedding.venue.name}, ${wedding.venue.address}`);
  assert.ok(url.searchParams.get("details").includes(wedding.venue.mapUrl));
});

test("calendar file matches Google details and retains a stable event identity", () => {
  const file = calendar.weddingCalendarFile(wedding, now);
  const lines = unfold(file).split("\r\n");
  assert.ok(lines.includes("DTSTAMP:20261107T100000Z"));
  assert.ok(lines.includes("DTSTART:20270101T103000Z"));
  assert.ok(lines.includes("DTEND:20270101T143000Z"));
  assert.ok(lines.includes("SUMMARY:Walimatul Urus Aiman & Atiqah"));
  assert.ok(lines.includes(`LOCATION:${`${wedding.venue.name}, ${wedding.venue.address}`.replace(/,/g, "\\,")}`));
  assert.ok(lines.some((line) => line.startsWith("DESCRIPTION:") && line.includes(wedding.venue.mapUrl)));
  assert.ok(file.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"));
  assert.ok(file.endsWith("END:VEVENT\r\nEND:VCALENDAR\r\n"));
  assert.ok(!file.replace(/\r\n/g, "").includes("\n"));
  const nextDownload = unfold(calendar.weddingCalendarFile(wedding, new Date("2026-11-08T10:00:00Z")));
  assert.equal(lines.find((line) => line.startsWith("UID:")), nextDownload.split("\r\n").find((line) => line.startsWith("UID:")));
});

test("calendar text escapes separators and folds UTF-8 without splitting characters", () => {
  const special = structuredClone(wedding);
  special.couple.partnerOne = "é🌸".repeat(40);
  special.venue.name = "Hall, garden; entrance\\exit\r\nSecond line";
  const file = calendar.weddingCalendarFile(special, now);
  for (const line of file.split("\r\n")) assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  assert.ok(unfold(file).includes(`SUMMARY:Walimatul Urus ${special.couple.partnerOne} & Atiqah`));
  assert.ok(unfold(file).includes("LOCATION:Hall\\, garden\\; entrance\\\\exit\\nSecond line"));
  assert.ok(!file.includes("�"));
});

test("GET /calendar returns a downloadable calendar with the shared event", async () => {
  const { GET } = loadSource("src/app/calendar/route.ts", {
    "@/data/wedding": { wedding },
    "@/lib/calendar": calendar,
  });
  const response = GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "text/calendar; charset=utf-8");
  assert.equal(response.headers.get("Content-Disposition"), 'attachment; filename="walimatul-urus.ics"');
  assert.ok(unfold(await response.text()).includes("DTSTART:20270101T103000Z"));
});
