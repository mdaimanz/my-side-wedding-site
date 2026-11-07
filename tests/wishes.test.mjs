import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);

// Compile the real modules in memory so the native Node runner can substitute
// Worker bindings and Next request context without connecting to a live database.
function loadSource(relativePath, mocks = {}, cache = new Map()) {
  const filename = path.join(root, relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loaded = { exports: {} };
  cache.set(filename, loaded);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const localRequire = (specifier) => {
    if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
    if (specifier.startsWith("@/")) {
      const relative = `src/${specifier.slice(2)}`;
      let extension = ".ts";
      try { readFileSync(path.join(root, `${relative}.ts`)); } catch { extension = ".tsx"; }
      return loadSource(`${relative}${extension}`, mocks, cache);
    }
    return require(specifier);
  };
  new Function("require", "module", "exports", outputText)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}

const { normalizeWeddingWishes } = loadSource("src/lib/wishes.ts");
const wish = (index) => ({ full_name: `Test Guest ${index}`, wish: `Test-only wish ${index}` });

function database(query) {
  let closed = 0;
  const db = loadSource("src/lib/db.ts", {
    "server-only": {},
    "cloudflare:workers": { env: { HYPERDRIVE: {} } },
    "mysql2/promise": { createConnection: async () => ({ query, end: async () => { closed += 1; } }) },
  });
  return { db, closed: () => closed };
}

test("normalization trims, rejects invalid content, caps after filtering, and strips private fields", () => {
  const input = [null, {}, { full_name: 42, wish: "Invalid" }, { full_name: "Valid", wish: null },
    { full_name: "\t\u00a0", wish: "Whitespace name" }, { full_name: "Valid", wish: "\n\uFEFF" },
    { full_name: " Guest ", wish: " First line\nSecond line ", phone_number: "PRIVATE" },
    ...Array.from({ length: 7 }, (_, index) => wish(index))];
  const result = normalizeWeddingWishes(input);
  assert.equal(result.length, 5);
  assert.deepEqual(result[0], { full_name: "Guest", wish: "First line\nSecond line" });
  assert.deepEqual(result[4], wish(3));
  assert.ok(result.every((item) => Object.keys(item).sort().join() === "full_name,wish"));
  assert.deepEqual(normalizeWeddingWishes(undefined), []);
  assert.deepEqual(normalizeWeddingWishes([]), []);
});

test("public data query selects approved public fields in a stable order and fills the limit after validation", async () => {
  const rows = [
    { full_name: "\t", wish: "Invalid" },
    ...Array.from({ length: 6 }, (_, index) => ({ ...wish(index), phone_number: "PRIVATE", read_at: new Date() })),
  ];
  const offsets = [];
  const { db, closed } = database(async (sql, [limit, offset]) => {
    const projection = sql.split("FROM")[0];
    assert.match(projection, /SELECT name AS full_name, message AS wish/);
    assert.match(projection, /NOW\(\) AS read_at/);
    assert.doesNotMatch(projection, /phone_number|attendance|guest_count|\*/);
    assert.match(sql, /WHERE display_wish = TRUE/);
    assert.match(sql, /ORDER BY updated_at DESC, id DESC/);
    offsets.push(offset);
    return [rows.slice(offset, offset + limit)];
  });
  assert.deepEqual(await db.listWeddingWishes(), Array.from({ length: 5 }, (_, index) => wish(index)));
  assert.deepEqual(offsets, [0, 5]);
  assert.equal(closed(), 1);
});

test("public data handles no records and closes the connection after query failure", async () => {
  const empty = database(async () => [[]]);
  assert.deepEqual(await empty.db.listWeddingWishes(), []);
  assert.equal(empty.closed(), 1);
  const failed = database(async () => { throw new Error("Database unavailable"); });
  await assert.rejects(failed.db.listWeddingWishes(), /Database unavailable/);
  assert.equal(failed.closed(), 1);
});

test("admin list reads bypass query caching and include the current publication flag", async () => {
  const { db } = database(async (sql) => {
    assert.match(sql, /display_wish/);
    assert.match(sql, /NOW\(\) AS read_at/);
    return [[]];
  });
  assert.deepEqual(await db.listGuests(), []);
});

test("public endpoint returns no-store data and a generic uncached error", async (context) => {
  const route = loadSource("src/app/api/wishes/route.ts", {
    "@/lib/db": { listWeddingWishes: async () => [wish(1)] },
  });
  const response = await route.GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { wishes: [wish(1)] });

  context.mock.method(console, "error", () => {});
  const failed = loadSource("src/app/api/wishes/route.ts", {
    "@/lib/db": { listWeddingWishes: async () => { throw new Error("SECRET connection details"); } },
  });
  const errorResponse = await failed.GET();
  assert.equal(errorResponse.status, 503);
  assert.equal(errorResponse.headers.get("cache-control"), "no-store");
  assert.doesNotMatch(await errorResponse.text(), /SECRET|connection details/);
});

function adminAction({ authenticated = true, updated = true, fail = false } = {}) {
  const writes = [];
  const revalidated = [];
  const actions = loadSource("src/app/actions/admin.ts", {
    "next/navigation": {},
    "next/cache": { revalidatePath: (value) => revalidated.push(value) },
    "@/lib/admin-auth": { requireAdmin: async () => { if (!authenticated) throw new Error("Unauthenticated"); } },
    "@/lib/db": { setWishVisibility: async (value) => {
      writes.push(value);
      if (fail) throw new Error("Database unavailable");
      return updated;
    } },
  });
  return { update: (data) => actions.updateWishVisibility({ status: "idle", message: "" }, data), writes, revalidated };
}

function visibilityForm(changes = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ guestId: "1", visible: "true", name: "Test Guest", message: "Test wish", ...changes })) {
    data.set(key, value);
  }
  return data;
}

test("visibility mutations authenticate before writing and reject malformed or empty publishing inputs", async () => {
  const denied = adminAction({ authenticated: false });
  await assert.rejects(denied.update(visibilityForm()), /Unauthenticated/);
  assert.equal(denied.writes.length, 0);
  const action = adminAction();
  for (const input of [{ guestId: "-1" }, { guestId: "1 OR 1=1" }, { guestId: "9007199254740992" },
    { visible: "yes" }, { name: "\t" }, { message: "\n\u00a0" }]) {
    assert.equal((await action.update(visibilityForm(input))).status, "error");
  }
  assert.equal(action.writes.length, 0);
});

test("publish and hide actions pass reviewed content and refresh the dashboard", async () => {
  const action = adminAction();
  assert.equal((await action.update(visibilityForm())).status, "success");
  assert.deepEqual(action.writes[0], { guestId: 1, visible: true, name: "Test Guest", message: "Test wish" });
  assert.equal((await action.update(visibilityForm({ visible: "false", message: "" }))).status, "success");
  assert.equal(action.writes[1].visible, false);
  assert.deepEqual(action.revalidated, ["/admin", "/admin"]);
});

test("stale approvals and database failures surface errors without a success refresh", async (context) => {
  const stale = adminAction({ updated: false });
  assert.equal((await stale.update(visibilityForm())).status, "error");
  assert.deepEqual(stale.revalidated, []);
  context.mock.method(console, "error", () => {});
  const failed = adminAction({ fail: true });
  assert.equal((await failed.update(visibilityForm())).status, "error");
  assert.deepEqual(failed.revalidated, []);
});

test("visibility update binds values and requires the exact reviewed name and wish", async () => {
  const input = { guestId: 1, visible: true, name: "Test Guest", message: "Test wish" };
  const { db, closed } = database(async (sql, parameters) => {
    assert.match(sql, /WHERE id = \?/);
    assert.match(sql, /CAST\(name AS BINARY\) = CAST\(\? AS BINARY\)/);
    assert.match(sql, /CAST\(COALESCE\(message, ''\) AS BINARY\) = CAST\(\? AS BINARY\)/);
    assert.deepEqual(parameters, [true, 1, input.name, input.message, true]);
    return [{ affectedRows: 1 }];
  });
  assert.equal(await db.setWishVisibility(input), true);
  assert.equal(closed(), 1);
});

test("RSVP upsert evaluates content approval before assigning new values", async () => {
  const input = { name: "Test Guest", phoneNumber: "PRIVATE", attendance: "attending", guestCount: 2, message: "Test wish" };
  const { db, closed } = database(async (sql, values) => {
    const update = sql.split("ON DUPLICATE KEY UPDATE")[1];
    assert.ok(update.indexOf("display_wish = IF(") < update.indexOf("name = VALUES(name)"));
    assert.match(update, /CAST\(name AS BINARY\) <=> CAST\(VALUES\(name\) AS BINARY\)/);
    assert.match(update, /CAST\(message AS BINARY\) <=> CAST\(VALUES\(message\) AS BINARY\)/);
    assert.match(update, /display_wish, FALSE/);
    assert.deepEqual(values, [input.name, input.phoneNumber, input.attendance, input.guestCount, input.message]);
    return [{}];
  });
  await db.upsertRsvp(input);
  assert.equal(closed(), 1);
});

test("marquee renders an empty state, one stationary wish, and at most five accessible wishes", () => {
  const { WeddingWishesMarquee } = loadSource("src/components/sections/wedding-wishes-marquee.tsx");
  const render = (wishes) => renderToStaticMarkup(createElement(WeddingWishesMarquee, { wishes }));
  assert.match(render([]), /Ucapan dan doa daripada tetamu akan dipaparkan di sini/);
  const single = render([wish(1)]);
  assert.match(single, /wishes-single/);
  assert.doesNotMatch(single, /animate-marquee|wishes-pause/);
  const multiple = render(Array.from({ length: 7 }, (_, index) => wish(index)));
  assert.equal((multiple.match(/wedding-wish-card/g) ?? []).length, 20);
  assert.equal((multiple.match(/aria-hidden="true" inert=""/g) ?? []).length, 3);
  assert.doesNotMatch(multiple, /Test Guest [56]/);
  assert.match(multiple, /aria-controls=/);
  const escaped = render([{ full_name: "<script>test</script>", wish: "<img src=x onerror=alert(1)>" }]);
  assert.doesNotMatch(escaped, /<script>|<img/);
  assert.match(escaped, /&lt;img/);
});
