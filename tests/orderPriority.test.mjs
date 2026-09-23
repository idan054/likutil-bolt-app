import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let viteServer;
let getOrderDeliveryBadgeType;
let sortOrdersByDeliveryPriority;

before(async () => {
  viteServer = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ getOrderDeliveryBadgeType, sortOrdersByDeliveryPriority } =
    await viteServer.ssrLoadModule("/src/utils/shippingMethod.ts"));
});

after(async () => {
  await viteServer?.close();
});

const order = (id, methodTitle) => ({
  id,
  shipping_lines: [{ method_title: methodTitle, method_id: "flat_rate" }],
});

test("fast orders come first while retaining the original order within each group", () => {
  const orders = [
    order(1, "משלוח רגיל"),
    order(2, "מהיום להיום"),
    order(3, "משלוח רגיל"),
    order(4, "מהיר לי"),
  ];

  assert.deepEqual(
    sortOrdersByDeliveryPriority(orders, {}).map(({ id }) => id),
    [2, 4, 1, 3]
  );
  assert.deepEqual(orders.map(({ id }) => id), [1, 2, 3, 4]);
});

test("asynchronous and manual decisions update the same priority shown by the badge", () => {
  const orders = [order(1, "משלוח רגיל"), order(2, "מהיר לי")];
  assert.deepEqual(
    sortOrdersByDeliveryPriority(orders, { 1: true, 2: false }).map(({ id }) => id),
    [1, 2]
  );
  assert.equal(
    getOrderDeliveryBadgeType(orders[1].shipping_lines, {
      deliveryType: "regular",
      decisionState: "manual",
    }),
    "regular"
  );
  assert.equal(
    getOrderDeliveryBadgeType(orders[0].shipping_lines, {
      deliveryType: "fast",
      decisionState: "manual",
    }),
    "fast"
  );
});

test("pickup and review orders do not outrank orders requiring fast shipping", () => {
  const orders = [
    order(1, "איסוף עצמי"),
    order(2, "משלוח רגיל"),
    order(3, "מהיום להיום"),
  ];
  assert.equal(
    getOrderDeliveryBadgeType(orders[0].shipping_lines, {
      deliveryType: "fast",
      decisionState: "auto",
    }),
    "pickup"
  );
  assert.deepEqual(
    sortOrdersByDeliveryPriority(orders, {}).map(({ id }) => id),
    [3, 1, 2]
  );
});
