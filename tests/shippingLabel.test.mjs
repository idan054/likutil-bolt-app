import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let viteServer;
let getShipmentLabelUrl;
let getReprintLabelUrl;
let getLabelCarrier;
let getDeliveryCity;
let mapOrderToDeliveryTask;

before(async () => {
  viteServer = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ getShipmentLabelUrl, getReprintLabelUrl, getLabelCarrier } =
    await viteServer.ssrLoadModule("/src/utils/shippingLabel.ts"));
  ({ getDeliveryCity, mapOrderToDeliveryTask } =
    await viteServer.ssrLoadModule("/src/services/delivery/mappers.ts"));
});

after(async () => {
  await viteServer?.close();
});

const base = "https://www.example.com/wp-admin/admin-post.php?action=s3_label&o=85626&t=signed-token";
const response = {
  print_label: "https://carrier.example.test/old-label",
  track_number: "2655939",
  DeliveryNumber: 2655939,
};

test("Negev label uses the returned shipment number and package count", () => {
  const url = new URL(getShipmentLabelUrl(base, 85626, "negevExpress", response, "3"));
  assert.equal(url.searchParams.get("c"), "negev");
  assert.equal(url.searchParams.get("d"), "2655939");
  assert.equal(url.searchParams.get("n"), "3");
  assert.equal(url.searchParams.get("t"), "signed-token");
  assert.equal(new URL(getShipmentLabelUrl(base, 85626, "negevExpress", response, "1")).searchParams.has("n"), false);
  assert.equal(getShipmentLabelUrl(base, 85626, "negevExpress", response, "21"), null);
});

test("Negev label and reprint use the exact city sent in the delivery request", () => {
  const order = {
    id: 85626,
    date_created: "2026-09-24",
    shipping: {
      first_name: "דנה", last_name: "כהן", address_1: "הראשון 1",
      city: "  תל  אביב  ", phone: "0501234567",
    },
    billing: { city: "חיפה", email: "" },
  };
  const sentCity = getDeliveryCity(order);
  assert.equal(mapOrderToDeliveryTask(order, "2").shipping.city, sentCity);
  assert.equal(sentCity, "תל אביב");
  assert.equal(getDeliveryCity({ ...order, shipping: { ...order.shipping, city: "" } }), "חיפה");

  const label = new URL(getShipmentLabelUrl(base, 85626, "negevExpress", response, "2", sentCity));
  assert.equal(label.searchParams.get("city"), sentCity);
  assert.match(label.toString(), /city=%D7/);
  const reprint = new URL(getReprintLabelUrl(base, 85626, "negevExpress", sentCity));
  assert.equal(reprint.searchParams.get("city"), sentCity);
  assert.equal(reprint.searchParams.has("d"), false);
});

test("Mahir Li uses the task id and never sends a package parameter", () => {
  const url = new URL(getShipmentLabelUrl(base, 85626, "mahirLi", {
    ...response,
    task_id: 28130601,
    id: 42,
  }, "4", "תל אביב"));
  assert.equal(url.searchParams.get("c"), "mahirli");
  assert.equal(url.searchParams.get("d"), "28130601");
  assert.equal(url.searchParams.has("n"), false);
  assert.equal(url.searchParams.has("city"), false);
  assert.equal(new URL(getReprintLabelUrl(base, 85626, "mahirLi", "תל אביב")).searchParams.has("city"), false);
});

test("reprinting uses the signed order link without a new shipment number", () => {
  const url = new URL(getReprintLabelUrl(base + "&d=old&n=5", 85626, "negevExpress"));
  assert.equal(url.searchParams.get("c"), "negev");
  assert.equal(url.searchParams.has("d"), false);
  assert.equal(url.searchParams.has("n"), false);
});

test("other carriers, wrong orders, missing numbers and unsafe links use no signed label", () => {
  assert.equal(getLabelCarrier("cargo"), null);
  assert.equal(getShipmentLabelUrl(base, 85626, "cargo", response, "1"), null);
  assert.equal(getShipmentLabelUrl(base, 85627, "negevExpress", response, "1"), null);
  assert.equal(getShipmentLabelUrl(base.replace("https:", "http:"), 85626, "negevExpress", response, "1"), null);
  assert.equal(getShipmentLabelUrl(base, 85626, "negevExpress", { ...response, DeliveryNumber: "", track_number: "" }, "1"), null);
});
