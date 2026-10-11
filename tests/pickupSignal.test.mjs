import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createServer as createHttpServer } from "node:http";
import { createServer } from "vite";
import React from "react";
import { act, create } from "react-test-renderer";

let vite;
let http;
let rules;
let service;
let PickupSignalBar;
let renderer;
let requests;
let respond;
let confirmAnswer;
let confirmQuestions;
const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const fixture = { connected: ["mahirLi", "zipGo", "negevExpress"], authType: "woo" };
globalThis.__pickupTest = fixture;

const carrier = (closedAt = null) => ({
  closed: Boolean(closedAt), closed_at: closedAt, by: closedAt ? "דני" : null, open_today: !closedAt,
});
const pickup = (overrides = {}) => ({
  v: 1, on: false, day: "2026-10-11", now: "2026-10-11T10:05:10+03:00", delivery_day: true,
  promise_hour: 11, remind_from: "11:30", ceiling_hour: 14,
  carriers: { mahirli: carrier(), zipgo: carrier(), negev: carrier() },
  ...overrides,
});
const json = (response, body, status = 200) => {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
};
const settle = async (predicate) => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) assert.fail("Timed out waiting for the pickup bar");
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
  }
};
const buttons = () => renderer.root.findAllByType("button");
const labels = () => buttons().map((button) => button.findAllByType("span").map((span) => span.children.join("")).join("")
  || button.children.join(""));
const mount = async () => {
  await act(async () => { renderer = create(React.createElement(PickupSignalBar)); });
};

before(async () => {
  globalThis.window = new EventTarget();
  window.setInterval = () => 0;
  window.clearInterval = () => {};
  window.confirm = (question) => { confirmQuestions.push(question); return confirmAnswer; };
  globalThis.document = new EventTarget();
  document.visibilityState = "visible";
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { onLine: true } });
  http = createHttpServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      const entry = { method: request.method, url: request.url, body: body ? JSON.parse(body) : null };
      requests.push(entry);
      respond(entry, response);
    });
  });
  await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
  vite = await createServer({
    appType: "custom", logLevel: "silent", server: { middlewareMode: true },
    ssr: { noExternal: ["react-hot-toast", "react-firebase-hooks", "lucide-react"] },
    plugins: [{
      name: "pickup-test-boundaries",
      enforce: "pre",
      resolveId(id) {
        if (["react-firebase-hooks/auth", "react-hot-toast", "lucide-react"].includes(id)) return `\0test:${id}`;
      },
      load(id) {
        const path = id.replaceAll("\\", "/");
        if (id === "\0test:react-hot-toast") return `
          export const toast = { error(message) { globalThis.__pickupTest.toasts.push(message); } };`;
        if (id === "\0test:react-firebase-hooks/auth") return `
          export const useAuthState = () => [{ email: "picker@example.test" }, false];`;
        if (id === "\0test:lucide-react") return `
          export const Check = () => null; export const Truck = () => null;`;
        if (path.endsWith("/config/firebase.ts")) return `export const auth = {};`;
        if (path.endsWith("/services/api/config.ts")) return `
          export const getApiConfig = () => globalThis.__pickupTest.config;`;
        if (path.endsWith("/services/settings/index.ts")) return `
          export const settingsStorage = { get: () => ({ authType: globalThis.__pickupTest.authType }) };`;
        if (path.endsWith("/hooks/settings/useDeliveryIntegrations.ts")) return `
          export const useDeliveryIntegrations = () => ({ integrations:
            globalThis.__pickupTest.connected.map((provider) => ({ provider, isConnected: true })) });`;
      },
    }],
  });
  rules = await vite.ssrLoadModule("/src/utils/pickupSignal.ts");
  service = await vite.ssrLoadModule("/src/services/pickup/pickup.service.ts");
  ({ PickupSignalBar } = await vite.ssrLoadModule("/src/components/dashboard/PickupSignalBar.tsx"));
});

beforeEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  renderer = null;
  requests = [];
  confirmAnswer = true;
  confirmQuestions = [];
  fixture.toasts = [];
  fixture.authType = "woo";
  fixture.connected = ["mahirLi", "zipGo", "negevExpress"];
  fixture.config = {
    platform: "woo", baseUrl: `http://127.0.0.1:${http.address().port}/wp-json/wc/v3`,
    headers: { "Content-Type": "application/json" },
  };
  respond = (_entry, response) => json(response, pickup());
});

after(async () => {
  if (renderer) await act(async () => renderer.unmount());
  await vite?.close();
  http?.closeAllConnections();
  await new Promise((resolve) => http.close(resolve));
  globalThis.window = originalWindow;
  globalThis.document = originalDocument;
  if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
  else delete globalThis.navigator;
  delete globalThis.__pickupTest;
});

test("buttons follow the couriers this account is connected to, in a fixed order", () => {
  assert.deepEqual(rules.pickupCarriersFor(["negevTovala", "zipGo", "hfd"]), ["zipgo", "negev"]);
  assert.deepEqual(rules.pickupCarriersFor([]), []);
});

test("a reported courier shows the site's own hour", () => {
  assert.equal(rules.pickupButtonLabel("mahirli", carrier()), "מהיר לי אסף");
  assert.equal(rules.pickupButtonLabel("mahirli", carrier("2026-10-11T12:05:03+03:00")), "מהיר לי נאסף 12:05");
  assert.equal(rules.pickupButtonLabel("zipgo", undefined), "ZIPGO אסף");
});

test("the reminder is for an unreported same-day courier, from the reminder hour, on a delivery day", () => {
  const late = pickup({ now: "2026-10-11T11:30:00+03:00" });
  assert.equal(rules.shouldRemindPickup(late, "mahirli"), true);
  assert.equal(rules.shouldRemindPickup(late, "negev"), false);
  assert.equal(rules.shouldRemindPickup(pickup({ now: "2026-10-11T11:29:59+03:00" }), "zipgo"), false);
  assert.equal(rules.shouldRemindPickup({ ...late, delivery_day: false }, "zipgo"), false);
  const reported = pickup({ now: late.now, carriers: { ...late.carriers, zipgo: carrier("2026-10-11T11:10:00+03:00") } });
  assert.equal(rules.shouldRemindPickup(reported, "zipgo"), false);
  const afterCeiling = pickup({ now: "2026-10-11T14:10:00+03:00",
    carriers: { ...late.carriers, zipgo: { ...carrier(), open_today: false } } });
  assert.equal(rules.shouldRemindPickup(afterCeiling, "zipgo"), false);
});

test("an answer that is not a pickup state is an error, not an empty state", async () => {
  respond = (_entry, response) => json(response, { message: "ok" });
  await assert.rejects(service.getPickupState());
});

test("a delivery day shows one button per connected courier and the closing button", async () => {
  fixture.connected = ["mahirLi", "negevExpress"];
  await mount();
  await settle(() => buttons().length > 0);
  assert.deepEqual(labels(), ["מהיר לי אסף", "נגב אסף", "סיימתי להיום"]);
  assert.equal(requests[0].url, "/wp-json/wc/v3/s3/pickup");
});

test("a day that is not a delivery day shows no buttons", async () => {
  respond = (_entry, response) => json(response, pickup({ delivery_day: false }));
  await mount();
  await settle(() => requests.length > 0);
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
  assert.equal(buttons().length, 0);
});

test("the bar's header stays when there are no buttons, and gives its place to them when there are", async () => {
  const header = React.createElement("h3", null, "הזמנות אחרונות");
  respond = (_entry, response) => json(response, pickup({ delivery_day: false }));
  await act(async () => { renderer = create(React.createElement(PickupSignalBar, { fallback: header })); });
  await settle(() => requests.length > 0);
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
  assert.equal(renderer.root.findAllByType("h3").length, 1);
  respond = (_entry, response) => json(response, pickup());
  await act(async () => { window.dispatchEvent(new Event("focus")); });
  await settle(() => buttons().length > 0);
  assert.equal(renderer.root.findAllByType("h3").length, 0);
  fixture.connected = [];
  await act(async () => { renderer.update(React.createElement(PickupSignalBar, { fallback: header })); });
  assert.equal(renderer.root.findAllByType("h3").length, 1);
});

test("a shop without the route shows nothing and is not asked again", async () => {
  respond = (_entry, response) => json(response, { code: "rest_no_route" }, 404);
  await mount();
  await settle(() => requests.length > 0);
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
  await act(async () => { window.dispatchEvent(new Event("focus")); await new Promise((resolve) => setTimeout(resolve, 30)); });
  assert.equal(buttons().length, 0);
  assert.equal(requests.length, 1);
});

test("a Shopify shop never asks the route", async () => {
  fixture.authType = "shopify";
  await mount();
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
  assert.equal(requests.length, 0);
});

test("pressing a courier reports it with the signed-in user and shows the hour", async () => {
  await mount();
  await settle(() => buttons().length > 0);
  respond = (entry, response) => json(response, entry.method === "POST"
    ? pickup({ carriers: { mahirli: carrier("2026-10-11T12:05:03+03:00"), zipgo: carrier(), negev: carrier() } })
    : pickup());
  await act(async () => { buttons()[0].props.onClick(); });
  await settle(() => labels()[0] === "מהיר לי נאסף 12:05");
  const post = requests.find(({ method }) => method === "POST");
  assert.deepEqual(post.body, { carrier: "mahirli", action: "close", by: "picker@example.test" });
  assert.equal(confirmQuestions.length, 0);
});

test("a reported courier reopens only after the picker confirms", async () => {
  respond = (_entry, response) => json(response,
    pickup({ carriers: { mahirli: carrier("2026-10-11T12:05:03+03:00"), zipgo: carrier(), negev: carrier() } }));
  await mount();
  await settle(() => buttons().length > 0);
  confirmAnswer = false;
  await act(async () => { buttons()[0].props.onClick(); });
  assert.equal(requests.filter(({ method }) => method === "POST").length, 0);
  confirmAnswer = true;
  await act(async () => { buttons()[0].props.onClick(); });
  await settle(() => requests.some(({ method }) => method === "POST"));
  assert.deepEqual(requests.find(({ method }) => method === "POST").body,
    { carrier: "mahirli", action: "reopen", by: "picker@example.test" });
});

test("the closing button reports all couriers after a confirmation, and rests once all are reported", async () => {
  await mount();
  await settle(() => buttons().length > 0);
  const closed = carrier("2026-10-11T13:00:00+03:00");
  respond = (_entry, response) => json(response, pickup({ carriers: { mahirli: closed, zipgo: closed, negev: closed } }));
  await act(async () => { buttons().at(-1).props.onClick(); });
  await settle(() => labels().at(-1) === "נסגר להיום");
  assert.equal(requests.find(({ method }) => method === "POST").body.carrier, "all");
  assert.equal(buttons().at(-1).props.disabled, true);
});

test("a failed report keeps the buttons and tells the picker", async () => {
  await mount();
  await settle(() => buttons().length > 0);
  respond = (_entry, response) => json(response, { code: "s3_pickup_bad_request", message: "bad" }, 400);
  await act(async () => { buttons()[1].props.onClick(); });
  await settle(() => fixture.toasts.length > 0);
  assert.deepEqual(labels(), ["מהיר לי אסף", "ZIPGO אסף", "נגב אסף", "סיימתי להיום"]);
});

test("a failed refresh keeps the last state and marks it", async () => {
  await mount();
  await settle(() => buttons().length > 0);
  respond = (_entry, response) => json(response, { message: "unavailable" }, 503);
  await act(async () => { window.dispatchEvent(new Event("focus")); });
  await settle(() => renderer.root.findAllByProps({ role: "status" }).length > 0);
  assert.equal(buttons().length, 4);
});
