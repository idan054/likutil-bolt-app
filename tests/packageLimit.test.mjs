import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let viteServer;
let maxPackagesPerShipment;
let packageLimitHint;

before(async () => {
  viteServer = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ maxPackagesPerShipment, packageLimitHint } = await viteServer.ssrLoadModule("/src/utils/packageLimit.ts"));
});

after(async () => {
  await viteServer?.close();
});

test("ZipGo takes two cartons in one shipment; the other couriers keep their limits", () => {
  assert.equal(maxPackagesPerShipment("zipGo"), 2);
  assert.equal(maxPackagesPerShipment("mahirLi"), 99);
  assert.equal(maxPackagesPerShipment("negevExpress"), 20);
  assert.equal(maxPackagesPerShipment("cargo"), 99);
});

test("only ZipGo tells the picker what to do above its limit", () => {
  assert.match(packageLimitHint("zipGo"), /יותר משני קרטונים: משלוח נוסף/);
  assert.equal(packageLimitHint("mahirLi"), null);
  assert.equal(packageLimitHint("negevExpress"), null);
});
