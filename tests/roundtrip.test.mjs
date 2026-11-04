import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let viteServer;
let hasRoundtripShipping;
let isLocalPickupShipping;
let isPickupShippingLine;
let getOrderDeliveryBadgeType;

const exchangeLine = { method_id: "flat_rate", method_title: "משלוח הלוך-חזור בשליח, כולל איסוף 2 גלילים סגורים" };

before(async () => {
  viteServer = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ hasRoundtripShipping } = await viteServer.ssrLoadModule("/src/utils/roundtrip.ts"));
  ({ isLocalPickupShipping } = await viteServer.ssrLoadModule("/src/utils/order.ts"));
  ({ isPickupShippingLine, getOrderDeliveryBadgeType } = await viteServer.ssrLoadModule("/src/utils/shippingMethod.ts"));
});

after(async () => {
  await viteServer?.close();
});

test("an exchange shipping line is a round trip", () => {
  assert.equal(hasRoundtripShipping([exchangeLine]), true);
  assert.equal(hasRoundtripShipping([{ method_title: "משלוח הלוך חזור" }]), true);
});

test("an exchange shipping line is a courier delivery, not a self-pickup", () => {
  assert.equal(isLocalPickupShipping([exchangeLine]), false);
  assert.equal(isPickupShippingLine(exchangeLine), false);
  assert.notEqual(getOrderDeliveryBadgeType([exchangeLine]), "pickup");
});

test("regular lines keep their old meaning", () => {
  assert.equal(hasRoundtripShipping([{ method_title: "משלוח עד הבית" }]), false);
  assert.equal(hasRoundtripShipping([]), false);
  assert.equal(hasRoundtripShipping(undefined), false);
  assert.equal(isLocalPickupShipping([{ method_id: "local_pickup", method_title: "איסוף עצמי" }]), true);
  assert.equal(isPickupShippingLine({ method_id: "local_pickup", method_title: "איסוף עצמי" }), true);
});
