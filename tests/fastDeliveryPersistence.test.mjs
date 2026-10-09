import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import { initializeApp, deleteApp } from "firebase/app";
import * as firestore from "firebase/firestore";

let vite, app, db, decide, save, read;
let writes = 0;
let writeFailure;
let releaseWrite;
// Real SDK validation and local-cache reads; network is disabled before writes.
// Server acknowledgement is replaced by a cache read. Live persistence is a
// separate release check, not a claim made by these offline contract tests.
before(async () => {
  app = initializeApp({ projectId: "demo-delivery-persistence" }, "delivery-tests");
  db = firestore.initializeFirestore(app, {});
  await firestore.disableNetwork(db);
  globalThis.__deliveryPersistence = {
    db, ...firestore,
    getDoc: firestore.getDocFromCache,
    async setDoc(ref, data, options) {
      writes++;
      if (writeFailure) throw writeFailure;
      if (releaseWrite) await releaseWrite;
      firestore.setDoc(ref, data, options).catch(() => {});
      await firestore.getDocFromCache(ref);
    },
  };
  vite = await createServer({
    appType: "custom", logLevel: "silent", server: { middlewareMode: true },
    ssr: { noExternal: ["firebase"] },
    plugins: [{
      name: "offline-firestore-boundary", enforce: "pre",
      resolveId(id) { if (id === "firebase/firestore") return "\0offline-firestore"; },
      load(id) {
        if (id === "\0offline-firestore") return `export const {doc, getDoc, setDoc, deleteField} = globalThis.__deliveryPersistence;`;
        if (id.replaceAll("\\", "/").endsWith("/config/firebase.ts")) return `export const {db} = globalThis.__deliveryPersistence;`;
      },
    }],
  });
  ({ decideFastDelivery: decide } = await vite.ssrLoadModule("/src/services/fastDelivery/decide.ts"));
  ({ upsertOrderDeliveryDecision: save, getOrderDeliveryDecision: read } = await vite.ssrLoadModule("/src/services/fastDelivery/decision.service.ts"));
});
after(async () => {
  await firestore.terminate(db);
  await deleteApp(app);
  await vite?.close();
  delete globalThis.__deliveryPersistence;
});
const input = (overrides = {}) => ({
  isVipMember: true, city: "City",
  lineItems: [{ productId: 1, name: "Item", unitPrice: 10, categories: [], categoryDataComplete: true }],
  rules: { cities: ["City"], blockedProductIds: [], blockedCategoryIds: [], blockedKeywords: [], blockedPriceThreshold: 100, vipRoles: [] },
  ...overrides,
});
const decision = (overrides = {}) => ({
  orderId: 1, deliveryType: "regular", decisionState: "auto", override: false,
  checks: [{ label: "Check", ok: false, detail: undefined }], ...overrides,
});

for (const [name, args, expectedType, expectedState] of [
  ["regular", { isVipMember: false }, "regular", "auto"],
  ["fast", {}, "fast", "auto"],
  ["missing city", { city: null }, "regular", "needs_review"],
  ["missing VIP", { isVipMember: null }, "regular", "needs_review"],
  ["empty items", { lineItems: [] }, "regular", "needs_review"],
  ["blocked product", { rules: { ...input().rules, blockedProductIds: [1] } }, "regular", "auto"],
  ["incomplete categories", { rules: { ...input().rules, blockedCategoryIds: [10] }, lineItems: [{ ...input().lineItems[0], categoryDataComplete: false }] }, "regular", "needs_review"],
]) test(`${name}: produced decision passes SDK serialization and reads back`, async () => {
  const result = decide(input(args));
  for (const check of result.checks) {
    assert.ok(!Object.hasOwn(check, "detail") || typeof check.detail === "string");
  }
  const saved = await save("store.invalid", decision(result));
  assert.equal(saved.deliveryType, expectedType);
  assert.equal(saved.decisionState, expectedState);
  const loaded = await read("store.invalid", 1);
  assert.deepEqual(loaded.checks, saved.checks);
  assert.equal(loaded.deliveryType, saved.deliveryType);
  assert.equal(loaded.updatedAt, saved.updatedAt);
});

test("shared boundary omits absent detail, retains false/empty text, and does not mutate input", async () => {
  const original = decision({ checks: [{ label: "Absent", ok: false, detail: undefined }, { label: "Empty", ok: true, detail: "" }] });
  const saved = await save("store.invalid", original);
  assert.deepEqual(saved.checks, [{ label: "Absent", ok: false }, { label: "Empty", ok: true, detail: "" }]);
  assert.ok(Object.hasOwn(original.checks[0], "detail"));
});

test("manual/site decisions round trip independently for two stores; sync retry clears old timestamp", async () => {
  const manual = decision({ override: true, decisionState: "manual", deliveryType: "fast", wooLastSyncAt: "2026-10-09T00:00:00Z" });
  await save("first.invalid", manual);
  await save("second.invalid", decision({ rulesUpdatedAt: "site-carrier", checks: [{ label: "Site", ok: true }] }));
  const updated = await save("first.invalid", { ...manual, wooSyncError: true, wooLastSyncAt: undefined });
  const first = await read("first.invalid", 1);
  assert.equal(first.override, true);
  assert.equal(first.decisionState, "manual");
  assert.equal(first.wooLastSyncAt, undefined);
  assert.equal(first.wooSyncError, true);
  assert.deepEqual(first.checks, updated.checks);
  const second = await read("second.invalid", 1);
  assert.equal(second.deliveryType, "regular");
  assert.equal(second.rulesUpdatedAt, "site-carrier");
});

test("invalid required or optional values fail before any write", async () => {
  const beforeWrites = writes;
  for (const bad of [
    { orderId: 0 }, { deliveryType: "other" }, { decisionState: "other" },
    { override: undefined }, { checks: null }, { checks: [{ label: "x", ok: undefined }] },
    { checks: [{ label: "", ok: true }] }, { checks: [{ label: "x", ok: true, detail: null }] },
    { wooSyncError: "false" }, { updatedAt: 123 }, { rulesUpdatedAt: {} },
  ]) await assert.rejects(save("store.invalid", decision(bad)), /Invalid delivery decision/);
  assert.equal(writes, beforeWrites);
});

test("persistence rejection propagates and save resolves only after the write", async () => {
  writeFailure = new Error("write rejected");
  await assert.rejects(save("store.invalid", decision()), /write rejected/);
  writeFailure = undefined;
  let unblock;
  releaseWrite = new Promise((resolve) => { unblock = resolve; });
  let settled = false;
  const pending = save("store.invalid", decision()).then(() => { settled = true; });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, false);
  unblock();
  await pending;
  releaseWrite = undefined;
  assert.equal(settled, true);
});
