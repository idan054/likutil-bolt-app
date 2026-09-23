import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let viteServer;
let getOrderItemMetadataDisplay;

before(async () => {
  viteServer = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ getOrderItemMetadataDisplay } = await viteServer.ssrLoadModule(
    "/src/utils/orderItemMetadata.ts"
  ));
});

after(async () => {
  await viteServer?.close();
});

test("daily deal metadata from the live example has business labels and values", () => {
  assert.deepEqual(getOrderItemMetadataDisplay("_s3d_daily_deal_purchase", 1), {
    label: "רכישה במבצע יומי",
    value: "כן",
  });
  const price = getOrderItemMetadataDisplay("_s3d_daily_deal_price", 69);
  assert.equal(price.label, "מחיר המבצע");
  assert.match(price.value, /69/);
  assert.match(price.value, /₪/);
  assert.deepEqual(
    getOrderItemMetadataDisplay("_s3d_daily_deal_expires_at", "2026-09-23 07:00:00"),
    { label: "תוקף המבצע עד", value: "23.09.2026 בשעה 07:00" }
  );
});

test("internal identifiers and stock bookkeeping do not appear as order instructions", () => {
  assert.equal(getOrderItemMetadataDisplay("_s3d_daily_deal_product_id", 13126), null);
  assert.equal(getOrderItemMetadataDisplay("_reduced_stock", 1), null);
  assert.equal(getOrderItemMetadataDisplay("_unknown_plugin_state", "raw"), null);
});

test("ordinary merchant metadata is retained and unusual values are not invented", () => {
  assert.deepEqual(getOrderItemMetadataDisplay("צבע", "כחול"), {
    label: "צבע",
    value: "כחול",
  });
  assert.deepEqual(getOrderItemMetadataDisplay("_s3d_daily_deal_purchase", 0), {
    label: "רכישה במבצע יומי",
    value: "לא",
  });
  assert.deepEqual(getOrderItemMetadataDisplay("_s3d_daily_deal_expires_at", "unknown"), {
    label: "תוקף המבצע עד",
    value: "unknown",
  });
});
