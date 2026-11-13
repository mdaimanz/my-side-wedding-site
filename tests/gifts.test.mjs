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

function database(query) {
  let closed = 0;
  const db = loadSource("src/lib/db.ts", {
    "server-only": {},
    "cloudflare:workers": { env: { HYPERDRIVE: {} } },
    "mysql2/promise": { createConnection: async () => ({ query, end: async () => { closed += 1; } }) },
  });
  return { db, closed: () => closed };
}

test("public gift query exposes only public fields, active gifts, and stable ordering", async () => {
  const { db, closed } = database(async (sql) => {
    const projection = sql.split("FROM gifts_aiman")[0];
    assert.match(projection, /g\.id, g\.name, g\.purchase_url/);
    assert.match(projection, /AS reserved/);
    assert.doesNotMatch(projection, /gifter_name|gifter_phone|reserved_at/);
    assert.match(sql, /WHERE g\.active = TRUE/);
    assert.match(sql, /ORDER BY g\.display_order ASC, g\.id ASC/);
    return [[{ id: 7, name: "Set cawan", purchase_url: "https://example.com/gift", reserved: 1, gifter_name: "PRIVATE" }]];
  });
  assert.deepEqual(await db.listPublicGifts(), [{ id: 7, name: "Set cawan", purchaseUrl: "https://example.com/gift", reserved: true }]);
  assert.equal(closed(), 1);
});

test("admin gift query includes private reservation details without changing the public shape", async () => {
  const reservedAt = new Date("2026-11-13T08:00:00Z");
  const updatedAt = new Date("2026-11-13T09:00:00Z");
  const { db } = database(async (sql) => {
    assert.match(sql, /LEFT JOIN gift_reservations_aiman/);
    assert.match(sql, /r\.gifter_name, r\.gifter_phone, r\.reserved_at/);
    assert.match(sql, /ORDER BY g\.active DESC, g\.display_order ASC, g\.id ASC/);
    return [[{
      id: 3, name: "Hadiah", purchase_url: "https://example.com/item", display_order: 2,
      active: 1, reserved: 1, gifter_name: "Tetamu", gifter_phone: "+60123456789",
      reserved_at: reservedAt, updated_at: updatedAt,
    }]];
  });
  assert.deepEqual(await db.listAdminGifts(), [{
    id: 3, name: "Hadiah", purchaseUrl: "https://example.com/item", reserved: true,
    displayOrder: 2, active: true, gifterName: "Tetamu", gifterPhone: "+60123456789",
    reservedAt, updatedAt,
  }]);
});

test("gift reservation insert is bound, active-only, and duplicate-safe", async () => {
  const input = { giftId: 4, name: "Tetamu Ujian", phoneNumber: "+60123456789" };
  const success = database(async (sql, values) => {
    assert.match(sql, /INSERT INTO gift_reservations_aiman/);
    assert.match(sql, /WHERE g\.id = \? AND g\.active = TRUE/);
    assert.deepEqual(values, [input.name, input.phoneNumber, input.giftId]);
    return [{ affectedRows: 1 }];
  });
  assert.equal(await success.db.createGiftReservation(input), true);
  assert.equal(success.closed(), 1);

  const missing = database(async () => [{ affectedRows: 0 }]);
  assert.equal(await missing.db.createGiftReservation(input), false);

  const duplicate = database(async () => { const error = new Error("Duplicate"); error.code = "ER_DUP_ENTRY"; throw error; });
  assert.equal(await duplicate.db.createGiftReservation(input), false);
  assert.equal(duplicate.closed(), 1);
});

function reservationAction({ reserved = true, fail = false } = {}) {
  const writes = [];
  const revalidated = [];
  const actions = loadSource("src/app/actions/gift.ts", {
    "next/cache": { revalidatePath: (value) => revalidated.push(value) },
    "@/lib/phone": { normalizeMalaysianPhone: (value) => value === "0123456789" ? "+60123456789" : null },
    "@/lib/db": { createGiftReservation: async (value) => {
      writes.push(value);
      if (fail) throw new Error("SECRET database details");
      return reserved;
    } },
  });
  const previous = { status: "idle", message: "", fieldErrors: {} };
  return { reserve: (data) => actions.reserveGift(previous, data), writes, revalidated };
}

function reservationForm(changes = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ giftId: "1", name: "Tetamu Ujian", phone: "0123456789", ...changes })) data.set(key, value);
  return data;
}

test("public reservation action validates all untrusted fields before writing", async () => {
  const action = reservationAction();
  for (const input of [
    { giftId: "0" }, { giftId: "1 OR 1=1" }, { giftId: "9007199254740992" },
    { name: "A" }, { name: "Nama 123" }, { phone: "invalid" },
  ]) {
    assert.equal((await action.reserve(reservationForm(input))).status, "error");
  }
  assert.equal(action.writes.length, 0);
});

test("successful reservations normalize private data and refresh both views", async () => {
  const action = reservationAction();
  const result = await action.reserve(reservationForm());
  assert.equal(result.status, "success");
  assert.deepEqual(action.writes, [{ giftId: 1, name: "Tetamu Ujian", phoneNumber: "+60123456789" }]);
  assert.deepEqual(action.revalidated, ["/gift", "/admin/gifts"]);
});

test("reservation conflicts and failures return safe messages", async (context) => {
  const conflict = reservationAction({ reserved: false });
  assert.equal((await conflict.reserve(reservationForm())).status, "conflict");
  assert.deepEqual(conflict.revalidated, ["/gift"]);

  context.mock.method(console, "error", () => {});
  const failed = reservationAction({ fail: true });
  const result = await failed.reserve(reservationForm());
  assert.equal(result.status, "error");
  assert.doesNotMatch(result.message, /SECRET|database details/);
  assert.deepEqual(failed.revalidated, []);
});

test("admin gift actions authenticate first and validate catalog inputs", async () => {
  const writes = [];
  let authenticated = 0;
  const actions = loadSource("src/app/actions/admin-gifts.ts", {
    "next/cache": { revalidatePath: () => {} },
    "@/lib/admin-auth": { requireAdmin: async () => { authenticated += 1; } },
    "@/lib/db": {
      createGift: async (value) => writes.push(value),
      updateGift: async () => true,
      setGiftActive: async () => true,
      releaseGiftReservation: async () => true,
    },
  });
  const previous = { status: "idle", message: "" };
  const invalid = new FormData();
  invalid.set("name", "Hadiah"); invalid.set("purchaseUrl", "javascript:alert(1)"); invalid.set("displayOrder", "0");
  assert.equal((await actions.createGift(previous, invalid)).status, "error");
  assert.equal(authenticated, 1);
  assert.equal(writes.length, 0);

  const valid = new FormData();
  valid.set("name", " Hadiah "); valid.set("purchaseUrl", "https://example.com/item"); valid.set("displayOrder", "2");
  assert.equal((await actions.createGift(previous, valid)).status, "success");
  assert.deepEqual(writes, [{ name: "Hadiah", purchaseUrl: "https://example.com/item", displayOrder: 2 }]);
});

test("admin edit, archive, and release actions authenticate and refresh both views", async () => {
  const calls = [];
  const revalidated = [];
  const actions = loadSource("src/app/actions/admin-gifts.ts", {
    "next/cache": { revalidatePath: (value) => revalidated.push(value) },
    "@/lib/admin-auth": { requireAdmin: async () => calls.push("authenticated") },
    "@/lib/db": {
      createGift: async () => {},
      updateGift: async (value) => { calls.push(["update", value]); return true; },
      setGiftActive: async (value) => { calls.push(["active", value]); return true; },
      releaseGiftReservation: async (value) => { calls.push(["release", value]); return true; },
    },
  });
  const previous = { status: "idle", message: "" };
  const edit = new FormData();
  edit.set("giftId", "5"); edit.set("name", "Hadiah"); edit.set("purchaseUrl", "https://example.com/item"); edit.set("displayOrder", "4");
  assert.equal((await actions.updateGift(previous, edit)).status, "success");

  const toggle = new FormData(); toggle.set("giftId", "5"); toggle.set("active", "false");
  assert.equal((await actions.toggleGiftActive(previous, toggle)).status, "success");

  const release = new FormData(); release.set("giftId", "5");
  assert.equal((await actions.releaseGift(previous, release)).status, "success");
  assert.deepEqual(calls, [
    "authenticated", ["update", { giftId: 5, name: "Hadiah", purchaseUrl: "https://example.com/item", displayOrder: 4 }],
    "authenticated", ["active", { giftId: 5, active: false }],
    "authenticated", ["release", 5],
  ]);
  assert.deepEqual(revalidated, ["/gift", "/admin/gifts", "/gift", "/admin/gifts", "/gift", "/admin/gifts"]);
});

test("unauthenticated admin mutations never reach the database", async () => {
  const writes = [];
  const actions = loadSource("src/app/actions/admin-gifts.ts", {
    "next/cache": { revalidatePath: () => {} },
    "@/lib/admin-auth": { requireAdmin: async () => { throw new Error("Unauthenticated"); } },
    "@/lib/db": {
      createGift: async (value) => writes.push(value),
      updateGift: async (value) => writes.push(value),
      setGiftActive: async (value) => writes.push(value),
      releaseGiftReservation: async (value) => writes.push(value),
    },
  });
  const form = new FormData();
  form.set("giftId", "5"); form.set("name", "Hadiah"); form.set("purchaseUrl", "https://example.com/item"); form.set("displayOrder", "1"); form.set("active", "false");
  const previous = { status: "idle", message: "" };
  await assert.rejects(actions.updateGift(previous, form), /Unauthenticated/);
  await assert.rejects(actions.toggleGiftActive(previous, form), /Unauthenticated/);
  await assert.rejects(actions.releaseGift(previous, form), /Unauthenticated/);
  assert.deepEqual(writes, []);
});

test("gift list renders safe links, reservation controls, empty and error states", () => {
  const { GiftList } = loadSource("src/components/gift/gift-list.tsx", {
    "@/app/actions/gift": { reserveGift: async () => ({ status: "idle", message: "", fieldErrors: {} }) },
  });
  const render = (props) => renderToStaticMarkup(createElement(GiftList, props));
  assert.match(render({ gifts: [] }), /Senarai hadiah akan dikemas kini/);
  assert.match(render({ gifts: [], loadError: true }), /belum dapat dimuatkan/);

  const html = render({ gifts: [
    { id: 1, name: "Hadiah tersedia", purchaseUrl: "https://example.com/one", reserved: false },
    { id: 2, name: "Hadiah ditempah", purchaseUrl: "https://example.com/two", reserved: true },
  ] });
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /<dialog/);
  assert.match(html, /Maklumat anda hanya boleh dilihat oleh pengantin/);
  assert.match(html, /Sudah ditempah/);
  assert.match(html, /disabled=""/);
  assert.doesNotMatch(html, /gifter|phone_number|\+601/);
});
