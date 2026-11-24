import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let vite;
let getPickingRoute;
let orderItemsForPicking;
let planWarehouseWalk;
let route;

before(async () => {
  vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  ({ getPickingRoute } = await vite.ssrLoadModule("/src/config/pickingRoutes.ts"));
  ({ orderItemsForPicking } = await vite.ssrLoadModule("/src/utils/pickingRoute.ts"));
  ({ planWarehouseWalk } = await vite.ssrLoadModule("/src/utils/warehouseWalk.ts"));
  route = getPickingRoute({ authType: "woo", storeUrl: "www.spider3d.co.il" });
  assert.ok(route);
});

after(async () => { await vite?.close(); });

const line = (id, sku, quantity = 1) => Object.freeze({ id, sku, quantity });
const codes = rows => rows.map(row => row.location?.primary);

test("the same warehouse route is used for both forms of the approved WooCommerce store", () => {
  assert.equal(getPickingRoute({ authType: "woo", storeUrl: "https://Spider3D.co.il/" }), route);
  assert.equal(getPickingRoute({ authType: "woo", storeUrl: "spider3d.co.il.shop.example" }), undefined);
  assert.equal(getPickingRoute({ authType: "woo", storeUrl: "spider3d.co.il/another-shop" }), undefined);
  assert.equal(getPickingRoute({ authType: "shopify", storeUrl: "spider3d.co.il" }), undefined);
  assert.equal(getPickingRoute({ authType: "woo", storeUrl: "" }), undefined);
  assert.equal(getPickingRoute(null), undefined);
});

test("order 87416 follows the walking sequence and retains all line identities and quantities", () => {
  const lines = Object.freeze([
    line(1, "X105 X205 X305", 2),
    line(2, "X212"),
    line(3, "x114."),
    line(4, "G119"),
    line(5, "A102 A202 A302"),
  ]);
  const rows = orderItemsForPicking(lines, route);
  assert.deepEqual(codes(rows), ["A102", "G119", "X114", "X212", "X105"]);
  assert.deepEqual(rows.map(row => row.item), [lines[4], lines[3], lines[2], lines[1], lines[0]]);
  assert.equal(rows.reduce((total, row) => total + row.item.quantity, 0), 6);
  assert.deepEqual(rows[4].location.alternatives, ["X205", "X305"]);
  assert.equal(rows[2].item.sku, "x114.");
});

test("the configured list order remains the fallback when a walking layout is unavailable", () => {
  const lines = ["B102", "X103", "A205", "C101", "A105", "X101", "B105", "G103", "H201", "C103"]
    .map((sku, index) => line(index + 1, sku));
  assert.deepEqual(codes(orderItemsForPicking(lines, { ...route, layout: undefined })), [
    "G103", "A105", "A205", "B105", "B102", "C101", "X101", "C103", "X103", "H201",
  ]);
});

test("the primary shelf wins over overflow and compatible abbreviations are shown as alternatives", () => {
  const rows = orderItemsForPicking([
    line(1, "Y203 / A201-A101 A201"), line(2, "A107/207"), line(3, "Y101"),
  ], route);
  assert.deepEqual(codes(rows), ["A101", "A107", "Y101"]);
  assert.deepEqual(rows[0].location, { primary: "A101", alternatives: ["A201"], overflow: ["Y203"] });
  assert.deepEqual(rows[1].location, { primary: "A107", alternatives: ["A207"], overflow: [] });
  assert.deepEqual(rows[2].location, { primary: "Y101", alternatives: [], overflow: [] });
});

test("unmapped and ambiguous SKUs stay visible after matched lines in original order", () => {
  const rows = orderItemsForPicking([
    line(1, ""), line(2, "X101"), line(3, "E135"), line(4, "A109 A209 A210"),
    line(5, "G110"), line(6, "A107/208"), line(7, "X101"), line(8, "part-A101"),
  ], route);
  assert.deepEqual(rows.map(row => row.item.id), [5, 2, 7, 1, 3, 4, 6, 8]);
  assert.deepEqual(codes(rows), ["G110", "X101", "X101", undefined, undefined, undefined, undefined, undefined]);
  assert.deepEqual(orderItemsForPicking([], route), []);
});

test("a short visit groups both sides and levels while moving outward from the station", () => {
  const lines = ["A205", "B104", "A105", "B105", "A102"].map((sku, index) => line(index + 1, sku));
  assert.deepEqual(codes(orderItemsForPicking(lines, route)), ["A102", "B104", "A105", "A205", "B105"]);
});

test("an order without G can go outward through A/B and back through both sides of C/X", () => {
  const lines = ["X207", "A102", "B125", "X127", "C106", "B201"].map((sku, index) => line(index + 1, sku));
  assert.deepEqual(codes(orderItemsForPicking(lines, route)), ["B201", "A102", "B125", "X127", "X207", "C106"]);
});

test("the upper G return visits nearby H308 and Y221 together before lower G positions", () => {
  const lines = ["Y221", "G105", "H308", "G224", "G228", "A128"].map((sku, index) => line(index + 1, sku));
  assert.deepEqual(codes(orderItemsForPicking(lines, route)), ["A128", "G228", "G224", "H308", "Y221", "G105"]);
});

test("the first aisle can be G and X is collected in descending positions on the return", () => {
  const lines = ["X207", "G103", "X127", "G228"].map((sku, index) => line(index + 1, sku));
  assert.deepEqual(codes(orderItemsForPicking(lines, route)), ["G103", "G228", "X127", "X207"]);
});

test("when both ends are reachable, short trips can cover a third aisle without crossing it", () => {
  const layout = {
    station: "front", preferredAisle: "A",
    walkways: ["A", "B", "X"].map(face => ({
      from: "front", to: "rear", length: 10, aisle: face,
      shelves: [{ faces: [face], firstPosition: 1, lastPosition: 10, firstDistance: 1, lastDistance: 10 }],
    })),
  };
  const shelves = [["A", 6], ["B", 6], ["X", 1], ["X", 9]].map(([face, position]) => ({ face, position }));
  const walk = planWarehouseWalk(layout, shelves);
  assert.equal(walk.distance, 24);
  assert.equal(walk.entrance, "A");
  assert.deepEqual(walk.order, [0, 3, 1, 2]);
});

test("an unmapped shelf in an incomplete layout keeps the known fallback order", () => {
  const rows = orderItemsForPicking([line(1, "A401"), line(2, "G129"), line(3, "A103")], route);
  assert.deepEqual(codes(rows), ["G129", "A103", "A401"]);
});
