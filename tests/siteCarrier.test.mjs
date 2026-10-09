import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let viteServer;
let providerForSiteCarrier;
let siteCarrierForProvider;
let preferredSiteProvider;
let siteDeliveryType;
let siteBlockedProviders;
let getOrderDeliveryBadgeType;
let sortOrdersByDeliveryPriority;

before(async () => {
  viteServer = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ providerForSiteCarrier, siteCarrierForProvider, preferredSiteProvider, siteDeliveryType, siteBlockedProviders } =
    await viteServer.ssrLoadModule("/src/utils/siteCarrier.ts"));
  ({ getOrderDeliveryBadgeType, sortOrdersByDeliveryPriority } =
    await viteServer.ssrLoadModule("/src/utils/shippingMethod.ts"));
});

after(async () => {
  await viteServer?.close();
});

test("site courier names map to our provider ids and back", () => {
  assert.equal(providerForSiteCarrier("zipgo"), "zipGo");
  assert.equal(providerForSiteCarrier("mahirli"), "mahirLi");
  assert.equal(providerForSiteCarrier("negev"), "negevExpress");
  assert.equal(providerForSiteCarrier(""), null);
  assert.equal(providerForSiteCarrier(undefined), null);
  assert.equal(providerForSiteCarrier("unknown"), null);
  assert.equal(siteCarrierForProvider("zipGo"), "zipgo");
  assert.equal(siteCarrierForProvider("mahirLi"), "mahirli");
  assert.equal(siteCarrierForProvider("negevExpress"), "negev");
  assert.equal(siteCarrierForProvider("negevTovala"), "negev");
  assert.equal(siteCarrierForProvider("cargo"), null);
});

test("the site's courier is preselected only when it is connected, else its fallback", () => {
  const all = new Set(["zipGo", "mahirLi", "negevExpress"]);
  const noZip = new Set(["mahirLi", "negevExpress"]);
  assert.equal(preferredSiteProvider({ use: "zipgo", fallback: "mahirli" }, all), "zipGo");
  assert.equal(preferredSiteProvider({ use: "zipgo", fallback: "mahirli" }, noZip), "mahirLi");
  assert.equal(preferredSiteProvider({ use: "zipgo", fallback: "negev" }, noZip), "negevExpress");
  assert.equal(preferredSiteProvider({ use: "zipgo", fallback: "" }, noZip), null);
  assert.equal(preferredSiteProvider({ use: "negev" }, all), "negevExpress");
  assert.equal(preferredSiteProvider({ use: "" , fallback: "mahirli" }, all), null);
  assert.equal(preferredSiteProvider(null, all), null);
});

test("couriers the site blocks for the town are keyed by our provider ids", () => {
  assert.deepEqual(siteBlockedProviders({ blocked: { zipgo: "לא מגיעה לחיפה" } }), { zipGo: "לא מגיעה לחיפה" });
  assert.deepEqual(
    siteBlockedProviders({ blocked: { zipgo: "א", mahirli: "ב" } }),
    { zipGo: "א", mahirLi: "ב" }
  );
  assert.deepEqual(siteBlockedProviders({ blocked: { negev: "x", zipgo: "א" } }), { zipGo: "א" });
  assert.deepEqual(siteBlockedProviders({ blocked: {} }), {});
  assert.deepEqual(siteBlockedProviders({ blocked: [] }), {});
  assert.deepEqual(siteBlockedProviders({ blocked: { unknown: "x", zipgo: "" } }), {});
  assert.deepEqual(siteBlockedProviders({ use: "zipgo" }), {});
  assert.deepEqual(siteBlockedProviders(null), {});
});

test("the delivery type badge: pickup, then a manual choice, then the site, then the old rules", () => {
  const regular = [{ method_id: "flexible_shipping_single", method_title: "משלוח רגיל — 3–7 ימי עסקים" }];
  const sameDay = [{ method_id: "flexible_shipping_single", method_title: "מהיום להיום — הזמנה עד 11:00" }];
  const pickup = [{ method_id: "local_pickup", method_title: "איסוף עצמי" }];
  // a regular-shipping order the site upgrades is a same-day order for the picker
  assert.equal(getOrderDeliveryBadgeType(regular, null, "fast"), "fast");
  assert.equal(getOrderDeliveryBadgeType(regular, { deliveryType: "regular", decisionState: "auto" }, "fast"), "fast");
  // the site says regular: Likutil's own automatic "fast" no longer applies
  assert.equal(getOrderDeliveryBadgeType(regular, { deliveryType: "fast", decisionState: "auto" }, "regular"), "regular");
  // a manual choice by the picker wins over the site
  assert.equal(getOrderDeliveryBadgeType(regular, { deliveryType: "regular", decisionState: "manual" }, "fast"), "regular");
  // pickup stays pickup
  assert.equal(getOrderDeliveryBadgeType(pickup, null, "fast"), "pickup");
  // no site decision: exactly as before
  assert.equal(getOrderDeliveryBadgeType(regular, null, null), "regular");
  assert.equal(getOrderDeliveryBadgeType(sameDay, null, null), "fast");
  assert.equal(getOrderDeliveryBadgeType(regular, { deliveryType: "fast", decisionState: "auto" }), "fast");
  assert.equal(getOrderDeliveryBadgeType(regular, { decisionState: "needs_review" }, undefined), "needs_review");
});

test("the list is sorted by the site's decision before any row reports", () => {
  const regular = [{ method_id: "flexible_shipping_single", method_title: "משלוח רגיל — 3–7 ימי עסקים" }];
  const sameDay = [{ method_id: "flexible_shipping_single", method_title: "מהיום להיום — הזמנה עד 11:00" }];
  const orders = [
    { id: 1, shipping_lines: regular, s3_carrier: { use: "negev", service: "regular" } },
    { id: 2, shipping_lines: regular, s3_carrier: { use: "zipgo", service: "regular", upgrade: true } },
    { id: 3, shipping_lines: sameDay, s3_carrier: { use: "", why: "before_start" } },
    { id: 4, shipping_lines: regular },
  ];
  assert.deepEqual(sortOrdersByDeliveryPriority(orders, {}).map((order) => order.id), [2, 3, 1, 4]);
  // what a row reported wins over the first guess
  assert.deepEqual(sortOrdersByDeliveryPriority(orders, { 2: false, 4: true }).map((order) => order.id), [3, 4, 1, 2]);
});

test("fast or regular follows the site only when it decided", () => {
  assert.equal(siteDeliveryType({ use: "zipgo" }), "fast");
  assert.equal(siteDeliveryType({ use: "mahirli" }), "fast");
  assert.equal(siteDeliveryType({ use: "negev" }), "regular");
  assert.equal(siteDeliveryType({ use: "negev", service: "regular" }), "regular");
  // the customer paid same-day and the site found no same-day courier: still a same-day order for the picker
  assert.equal(siteDeliveryType({ use: "negev", service: "sameday" }), "fast");
  assert.equal(siteDeliveryType({ use: "" }), null);
  assert.equal(siteDeliveryType({ use: "something-new" }), null);
  assert.equal(siteDeliveryType(null), null);
  assert.equal(siteDeliveryType(undefined), null);
});
