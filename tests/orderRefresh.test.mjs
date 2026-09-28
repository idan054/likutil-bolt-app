import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createServer as createHttpServer } from "node:http";
import { createServer } from "vite";
import React from "react";
import { act, create } from "react-test-renderer";

let vite;
let http;
let service;
let apiClient;
let useProcessingOrders;
let OrdersDashboard;
let useOrderSearch;
let renderer;
let latest;
let requests;
let respond;
let tenant = 0;
const originalWindow = globalThis.window;
const originalStorage = globalThis.localStorage;
const originalDocument = globalThis.document;
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const intervals = new Set();
const storage = new Map();
const fixture = { settings: null, options: [] };
globalThis.__ordersRefreshTest = fixture;

const order = (id, status = "processing") => ({
  id, status, line_items: [], date_created_gmt: "2026-09-28T06:00:00",
});
const json = (response, body, status = 200) => {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
};
const settle = async (predicate) => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) assert.fail("Timed out waiting for the order request");
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
  }
};

before(async () => {
  globalThis.window = new EventTarget();
  window.history = { pushState() {} };
  window.setInterval = (callback) => { intervals.add(callback); return callback; };
  window.clearInterval = (callback) => intervals.delete(callback);
  globalThis.document = new EventTarget();
  document.visibilityState = "visible";
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { onLine: true } });
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  http = createHttpServer((request, response) => {
    requests.push({ method: request.method, url: request.url });
    respond(request, response);
  });
  await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
  vite = await createServer({
    appType: "custom", logLevel: "silent", server: { middlewareMode: true },
    ssr: { noExternal: ["react-hot-toast", "react-firebase-hooks", "framer-motion"] },
    plugins: [{
      name: "orders-test-boundaries",
      enforce: "pre",
      resolveId(id) {
        if (["framer-motion", "react-firebase-hooks/auth", "react-hot-toast"].includes(id)) return `\0test:${id}`;
      },
      load(id) {
        const path = id.replaceAll("\\", "/");
        if (id === "\0test:react-hot-toast") return `
          export const toast = { loading() {}, success() {}, error() {} };`;
        if (id === "\0test:react-firebase-hooks/auth") return `
          export const useAuthState = () => [globalThis.__ordersRefreshTest.user, false];`;
        if (id === "\0test:framer-motion") return `
          import React from 'react';
          export const AnimatePresence = ({children}) => children;
          export const motion = { div: ({children, ...props}) => React.createElement('div', props, children) };`;
        if (path.endsWith("/config/firebase.ts")) return `export const auth = {};`;
        if (path.endsWith("/services/auth/woo-auth.ts")) return `export const resetUserOneTimeToken = () => {};`;
        if (path.endsWith("/services/analytics.ts")) return `export const analytics = { identify() {} };`;
        if (path.endsWith("/hooks/useSuperOrder.ts")) return `export const useSuperOrder = () => ({});`;
        for (const name of ["OrderSearch", "ProcessingOrdersCounter", "StatusFilter", "OrdersList",
          "SuperOrderModal", "LoadingState", "EmptyState", "AppInfoStatus", "OrderDetails", "FloatingTipMessage"]) {
          if (path.endsWith('/' + name + '.tsx')) return `
            import React from 'react';
            export const ${name} = props => React.createElement('${name}', props);`;
        }
        if (path.endsWith("/services/api/config.ts")) return `
          export const getApiConfig = () => globalThis.__ordersRefreshTest.config;`;
        if (path.endsWith("/services/settings/index.ts")) return `
          export const settingsStorage = { get: () => globalThis.__ordersRefreshTest.settings };`;
        if (path.endsWith("/hooks/useSettings.ts")) return `
          export const useSettings = () => ({ settings: globalThis.__ordersRefreshTest.settings,
            user: globalThis.__ordersRefreshTest.user, orderStatuses: globalThis.__ordersRefreshTest.statuses ?? [] });`;
        if (path.endsWith("/hooks/useGetFirebaseMetadata.ts")) return `
          export const useGetFirebaseMetadata = () => ({ options: globalThis.__ordersRefreshTest.options });`;
        if (path.endsWith("/utils/error.ts")) return `export const showErrorToast = () => {};`;
      },
    }],
  });
  service = await vite.ssrLoadModule("/src/services/orders/orders.service.ts");
  ({ apiClient } = await vite.ssrLoadModule("/src/services/api/client.ts"));
  ({ useProcessingOrders } = await vite.ssrLoadModule("/src/hooks/useProcessingOrders.ts"));
  ({ OrdersDashboard } = await vite.ssrLoadModule("/src/components/dashboard/OrdersDashboard.tsx"));
  ({ useOrderSearch } = await vite.ssrLoadModule("/src/hooks/orders/useOrderSearch.ts"));
});

beforeEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  renderer = null;
  latest = null;
  storage.clear();
  storage.set("selectedOrderStatus", '"processing"');
  fixture.settings = { authType: "woo", storeUrl: `tenant-${++tenant}.invalid` };
  fixture.user = { uid: `user-${tenant}` };
  fixture.statuses = [];
  document.visibilityState = "visible";
  navigator.onLine = true;
  fixture.config = {
    platform: "woo", baseUrl: `http://127.0.0.1:${http.address().port}/${tenant}`,
    headers: { "Content-Type": "application/json" },
  };
  requests = [];
  respond = (_request, response) => json(response, [order(1)]);
});

after(async () => {
  if (renderer) await act(async () => renderer.unmount());
  await vite?.close();
  http?.closeAllConnections();
  await new Promise((resolve) => http.close(resolve));
  globalThis.window = originalWindow;
  globalThis.localStorage = originalStorage;
  globalThis.document = originalDocument;
  if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
  else delete globalThis.navigator;
  delete globalThis.__ordersRefreshTest;
});

test("forced refresh reads the server even inside the 30-second cache window", async () => {
  await service.getFilteredOrdersPage("processing");
  respond = (_request, response) => json(response, []);
  const page = await service.getFilteredOrdersPage("processing", undefined, undefined, { forceRefresh: true });
  assert.equal(page.orders.length, 0);
  assert.equal(requests.length, 2);
});

test("confirmed status changes invalidate the real list and detail cache keys", async () => {
  await service.getFilteredOrdersPage("processing");
  respond = (request, response) => json(response,
    request.method === "POST" ? order(1, "s3-packed") : request.url.endsWith('/orders/1') ? order(1) : []);
  const saved = await service.updateOrderStatus("1", "s3-packed");
  assert.equal(saved.status, "s3-packed");
  assert.equal((await service.getFilteredOrdersPage("processing")).orders.length, 0);
});

test("HTTP failures keep their status instead of masquerading as network failures", async () => {
  respond = (_request, response) => json(response, { message: "temporarily unavailable" }, 503);
  await assert.rejects(apiClient({ method: "GET", path: "/orders" }),
    (error) => error.details?.responseStatus === 503);
});

test("invalid successful responses cannot silently turn into an empty order list", async () => {
  respond = (_request, response) => json(response, { error: "upstream unavailable" });
  await assert.rejects(service.getFilteredOrdersPage("processing"));
});

function Orders({ status }) { latest = useProcessingOrders(status); return null; }
const mountOrders = async (status) => {
  await act(async () => { renderer = create(React.createElement(Orders, { status })); });
  await settle(() => !latest.isLoading);
};

test("refresh failure preserves the list and stays visible until a successful retry", async () => {
  await mountOrders();
  assert.equal(latest.orders.length, 1);
  respond = (_request, response) => json(response, { message: "unavailable" }, 503);
  await act(async () => { await latest.refetch(true); });
  assert.ok(latest.error);
  assert.equal(latest.orders.length, 1);
  let finish;
  respond = (_request, response) => { finish = () => json(response, []); };
  let pending;
  await act(async () => { pending = latest.refetch(true); });
  await settle(() => Boolean(finish));
  assert.ok(latest.error, "starting a retry must not clear the warning");
  assert.ok(latest.isRefetching);
  await act(async () => { finish(); await pending; });
  assert.equal(latest.error, null);
  assert.equal(latest.orders.length, 0);
});

test("a page reload fetches fresh server state despite another mounted consumer's cache", async () => {
  await mountOrders();
  await act(async () => renderer.unmount());
  respond = (_request, response) => json(response, []);
  await mountOrders();
  assert.equal(latest.orders.length, 0);
  assert.equal(requests.length, 2);
});

test("a late read cannot overwrite a newer forced response in the shared cache", async () => {
  let finishOld;
  respond = (_request, response) => { finishOld = () => json(response, [order(1)]); };
  const oldRequest = service.getFilteredOrdersPage("processing");
  await settle(() => Boolean(finishOld));
  respond = (_request, response) => json(response, []);
  await service.getFilteredOrdersPage("processing", undefined, undefined, { forceRefresh: true });
  finishOld();
  await oldRequest;
  assert.equal((await service.getFilteredOrdersPage("processing")).orders.length, 0);
  assert.equal(requests.length, 2);
});

test("a status write with a lost reply is reconciled by a read without repeating the write", async () => {
  await service.getFilteredOrdersPage("processing");
  respond = (request, response) => {
    if (request.method === "POST") request.socket.destroy();
    else json(response, request.url.endsWith('/orders/1') ? order(1) : []);
  };
  await assert.rejects(service.updateOrderStatus("1", "s3-packed"));
  assert.equal((await service.getFilteredOrdersPage("processing")).orders.length, 0);
  assert.equal(requests.filter(({ method }) => method === "POST").length, 1);
});

test("an overlapping refresh replaces the pending request and ignores its late response", async () => {
  await mountOrders("processing");
  let finishOld;
  respond = (_request, response) => { finishOld = () => json(response, [order(1)]); };
  let pending;
  await act(async () => { pending = latest.refetch(true); });
  await settle(() => Boolean(finishOld));
  respond = (_request, response) => json(response, []);
  await act(async () => { await latest.refetch(true); });
  finishOld();
  await pending;
  assert.equal(latest.orders.length, 0);
  assert.equal(latest.error, null);
  assert.equal(latest.isRefetching, false);
});

test("changing filters cancels an old request and accepts only the new filter", async () => {
  await mountOrders("processing");
  let finishOld;
  respond = (_request, response) => { finishOld = () => json(response, [order(1)]); };
  let pending;
  await act(async () => { pending = latest.refetch(true); });
  await settle(() => Boolean(finishOld));
  respond = (_request, response) => json(response, [order(2, "s3-packed")]);
  await act(async () => renderer.update(React.createElement(Orders, { status: "s3-packed" })));
  await settle(() => !latest.isLoading);
  finishOld();
  await pending;
  assert.deepEqual(latest.orders.map(({ id }) => id), [2]);
  assert.equal(latest.orderPage.status, "s3-packed");
});

test("another tab's saved filter cannot switch this tab's active filter", async () => {
  await mountOrders("processing");
  storage.set("selectedOrderStatus", '"completed"');
  await act(async () => { await latest.refetch(true); });
  assert.equal(latest.orderPage.status, "processing");
  assert.match(requests.at(-1).url, /status=processing/);
});

test("store changes clear old orders and discard a previous store's pending response", async () => {
  await mountOrders("processing");
  let finishOld;
  respond = (_request, response) => { finishOld = () => json(response, [order(1)]); };
  let pending;
  await act(async () => { pending = latest.refetch(true); });
  await settle(() => Boolean(finishOld));
  fixture.settings = { ...fixture.settings, storeUrl: "another-store.invalid" };
  respond = (_request, response) => json(response, [order(99)]);
  await act(async () => renderer.update(React.createElement(Orders, { status: "processing" })));
  await settle(() => !latest.isLoading);
  finishOld();
  await pending;
  assert.deepEqual(latest.orders.map(({ id }) => id), [99]);
  assert.equal(latest.error, null);
});

test("Shopify stores sharing one API keep separate order caches", async () => {
  fixture.config.platform = "shopify";
  fixture.settings = { ...fixture.settings, authType: "shopify", myShopifyUrl: "shop-a.myshopify.com" };
  storage.set("wc_settings", JSON.stringify(fixture.settings));
  respond = (_request, response) => json(response, { orders: [{...order(1), financial_status: 'paid'}], total: 1 });
  const first = await service.getFilteredOrdersPage("pending");
  fixture.settings = { ...fixture.settings, myShopifyUrl: "shop-b.myshopify.com" };
  storage.set("wc_settings", JSON.stringify(fixture.settings));
  respond = (_request, response) => json(response, { orders: [], total: 0 });
  const second = await service.getFilteredOrdersPage("pending");
  assert.equal(first.orders.length, 1);
  assert.equal(second.orders.length, 0);
  assert.equal(requests.length, 2);
});

test("a stalled request times out, releases the loading state and permits recovery", async () => {
  await mountOrders();
  const originalTimeout = globalThis.setTimeout;
  let expire;
  globalThis.setTimeout = (callback, delay, ...args) => {
    if (delay === 20_000) {
      expire = callback;
      return originalTimeout(() => {}, 60_000);
    }
    return originalTimeout(callback, delay, ...args);
  };
  try {
    let stalled = false;
    respond = () => { stalled = true; };
    let pending;
    await act(async () => { pending = latest.refetch(true); });
    await settle(() => stalled);
    await act(async () => { expire(); await pending; });
    assert.equal(latest.error?.name, "TimeoutError");
    assert.equal(latest.isRefetching, false);
    assert.equal(latest.orders.length, 1);
    respond = (_request, response) => json(response, []);
    await act(async () => { await latest.refetch(true); });
    assert.equal(latest.error, null);
    assert.equal(latest.orders.length, 0);
  } finally {
    globalThis.setTimeout = originalTimeout;
  }
});

const mountDashboard = async () => {
  await act(async () => { renderer = create(React.createElement(OrdersDashboard)); });
  await settle(() => renderer.root.findByType("OrdersList").props.orders.length === 1);
};
const listedIds = () => renderer.root.findByType("OrdersList").props.orders.map(({ id }) => id);
const refreshDashboard = () => renderer.root.findAllByType("button")
  .find(({ props }) => props.children === "רענון ההזמנות").props.onClick();

test("the dashboard recovers on reconnect and keeps the warning until the read succeeds", async () => {
  await mountDashboard();
  respond = (_request, response) => json(response, { message: "unavailable" }, 503);
  await act(async () => refreshDashboard());
  await settle(() => renderer.root.findAllByProps({ role: "alert" }).length === 1);
  assert.deepEqual(listedIds(), [1]);
  let finish;
  respond = (_request, response) => { finish = () => json(response, []); };
  await act(async () => window.dispatchEvent(new Event("online")));
  await settle(() => Boolean(finish));
  assert.equal(renderer.root.findAllByProps({ role: "alert" }).length, 1);
  finish();
  await settle(() => listedIds().length === 0);
  assert.equal(renderer.root.findAllByProps({ role: "alert" }).length, 0);
});

test("periodic refresh removes orders changed by another worker", async () => {
  await mountDashboard();
  assert.equal(intervals.size, 1);
  respond = (_request, response) => json(response, []);
  await act(async () => { for (const tick of intervals) tick(); });
  await settle(() => listedIds().length === 0);
  assert.equal(renderer.root.findByType("ProcessingOrdersCounter").props.loadedCount, 0);
});

test("background updates pause while an order is open and returning to the list refreshes", async () => {
  await mountDashboard();
  await act(async () => renderer.root.findByType("OrdersList").props.onSelectOrder("1"));
  assert.equal(intervals.size, 0);
  const count = requests.length;
  respond = (_request, response) => json(response, []);
  await act(async () => {
    window.dispatchEvent(new Event("online"));
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  assert.equal(requests.length, count);
  assert.equal(renderer.root.findByType("OrderDetails").props.order.id, 1);
  await act(async () => renderer.root.findByType("OrderDetails").props.onReset());
  await settle(() => listedIds().length === 0);
  assert.equal(intervals.size, 1);
});

test("hidden or offline screens do not poll; returning to a visible screen refreshes", async () => {
  await mountDashboard();
  const count = requests.length;
  document.visibilityState = "hidden";
  await act(async () => { for (const tick of intervals) tick(); });
  document.visibilityState = "visible";
  navigator.onLine = false;
  await act(async () => { for (const tick of intervals) tick(); });
  assert.equal(requests.length, count);
  navigator.onLine = true;
  respond = (_request, response) => json(response, []);
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  await settle(() => listedIds().length === 0);
});

test("opening an order cancels an already pending background refresh", async () => {
  await mountDashboard();
  let finish;
  respond = (_request, response) => { finish = () => json(response, []); };
  await act(async () => { for (const tick of intervals) tick(); });
  await settle(() => Boolean(finish));
  await act(async () => renderer.root.findByType("OrdersList").props.onSelectOrder("1"));
  await act(async () => { finish(); await new Promise((resolve) => setTimeout(resolve, 30)); });
  assert.equal(renderer.root.findByType("OrderDetails").props.order.id, 1);
});

test("refreshing the list cannot unmount an open order that no longer matches the filter", async () => {
  await mountDashboard();
  await act(async () => renderer.root.findByType("OrdersList").props.onSelectOrder("1"));
  const originalOrder = renderer.root.findByType("OrderDetails").props.order;
  respond = (_request, response) => json(response, []);
  await act(async () => refreshDashboard());
  await settle(() => listedIds().length === 0);
  assert.equal(renderer.root.findByType("OrderDetails").props.order, originalOrder);
  assert.equal(intervals.size, 0);
  await act(async () => renderer.root.findByType("OrderDetails").props.onReset());
  assert.equal(renderer.root.findAllByType("OrderDetails").length, 0);
});

test("switching stores clears the active order instead of carrying its draft to another tenant", async () => {
  await mountDashboard();
  await act(async () => renderer.root.findByType("OrdersList").props.onSelectOrder("1"));
  fixture.settings = { ...fixture.settings, storeUrl: "another-tenant.invalid" };
  respond = (_request, response) => json(response, [order(2)]);
  await act(async () => renderer.update(React.createElement(OrdersDashboard)));
  await settle(() => listedIds().includes(2));
  assert.equal(renderer.root.findAllByType("OrderDetails").length, 0);
});

test("initial connection failure is not displayed as all orders having been handled", async () => {
  respond = (_request, response) => json(response, { message: "unavailable" }, 503);
  await act(async () => { renderer = create(React.createElement(OrdersDashboard)); });
  await settle(() => renderer.root.findAllByProps({ role: "alert" }).length === 1);
  assert.equal(renderer.root.findAllByType("EmptyState").length, 0);
  respond = (_request, response) => json(response, [order(2)]);
  await act(async () => window.dispatchEvent(new Event("online")));
  await settle(() => listedIds().includes(2));
  assert.equal(renderer.root.findAllByProps({ role: "alert" }).length, 0);
});

test("all statuses exclude quote documents, unpaid drafts and frozen orders before mapping", async () => {
  respond = (_request, response) => json(response, [
    order(85765, 'rfq-sent'), order(2, 'pending'), order(3, 'checkout-draft'), order(4, 'on-hold'),
    {...order(5, 'completed'), meta_data:[{key:'_s3rfq',value:'1'}]},
    {...order(6), meta_data:[{key:'_s3rfq_frozen',value:1}]}, order(7),
    {...order(8), status:undefined},
  ]);
  const page = await service.getFilteredOrdersPage(null);
  assert.deepEqual(page.orders.map(({id}) => id), [7]);
  assert.equal(page.total, 1);
});

test("approved B2B picking children and cash-on-delivery orders do not require prepaid funds", async () => {
  respond = (_request, response) => json(response, [
    {...order(1), payment_method:'cod', date_paid:null},
    {...order(2), payment_method:'other', date_paid:null, meta_data:[{key:'_s3rfq',value:1},{key:'_s3rfq_child',value:1},{key:'_s3rfq_parent',value:85765}]},
    order(3, 's3-packed'), order(4, 'acounting'),
  ]);
  assert.deepEqual((await service.getFilteredOrdersPage(null)).orders.map(({id})=>id), [1,2,3,4]);
});

test("filtering a page of proposals continues to actual picking orders on the next page", async () => {
  respond = (request, response) => {
    response.setHeader('X-WP-Total', '16');
    json(response, request.url.includes('page=2') ? [order(16)] : Array.from({length:15}, (_,i)=>order(i+1,'rfq-sent')));
  };
  const page = await service.getFilteredOrdersPage(null);
  assert.deepEqual(page.orders.map(({id})=>id), [16]);
  assert.equal(page.total, 1);
  assert.equal(requests.length, 2);
});

test("a bounded incomplete scan never claims there are no orders to pick", async () => {
  respond = (_request, response) => json(response, Array.from({length:15},(_,i)=>order(i+1,'rfq-sent')));
  await assert.rejects(service.getFilteredOrdersPage(null), /הבדיקה טרם הגיעה/);
  assert.equal(requests.length, 5);
});

test("search rechecks approval instead of returning a previously cached eligible order", async () => {
  respond = (_request, response) => json(response, order(1));
  assert.equal((await service.searchOrderById('1')).id, 1);
  respond = (_request, response) => json(response, order(1, 'rfq-sent'));
  await assert.rejects(service.searchOrderById('1'), error=>error.name==='OrderNotReadyError' && /הצעת מחיר/.test(error.message));
});

test("direct detail access cannot open unpaid orders or paid RFQ parent documents", async () => {
  for (const raw of [order(1,'pending'), {...order(2,'completed'),meta_data:[{key:'_s3rfq',value:'1'}]}]) {
    respond = (_request,response)=>json(response,raw);
    await assert.rejects(service.getOrderById(String(raw.id), true), error=>error.name==='OrderNotReadyError');
  }
});

test("picker status controls cannot approve a proposal or a pending payment order", async () => {
  for (const status of ['rfq-sent','pending']) {
    respond = (_request,response)=>json(response,order(1,status));
    await assert.rejects(service.updateOrderStatus('1','processing'), error=>error.name==='OrderNotReadyError');
  }
  assert.deepEqual(requests.map(({method})=>method), ['GET','GET']);
});

test("a blocked saved filter is migrated and unapproved filters are absent from the picker", async () => {
  storage.set('selectedOrderStatus', '"rfq-sent"');
  fixture.statuses = ['processing','completed','rfq-sent','rfq-order','pending','on-hold'].map(slug=>({slug,name:slug}));
  await mountDashboard();
  const filter = renderer.root.findByType('StatusFilter').props;
  assert.equal(filter.selectedStatus, 'processing');
  assert.deepEqual(filter.statuses.map(({slug})=>slug), ['processing','completed']);
});

test("blocked searches show a persistent explanation and no order data", async () => {
  storage.set('wc_settings', JSON.stringify(fixture.settings));
  function Search() { latest = useOrderSearch(); return null; }
  await act(async () => { renderer = create(React.createElement(Search)); });
  respond = (_request,response)=>json(response,order(85765,'rfq-sent'));
  let result;
  await act(async () => { result = await latest.searchOrder('85765'); });
  assert.equal(result, undefined);
  assert.equal(latest.order, null);
  assert.match(latest.error, /הצעת מחיר/);
  assert.equal(latest.isLoading, false);
  respond = (_request,response)=>json(response,order(1));
  await act(async () => { await latest.searchOrder('1'); });
  assert.equal(latest.error, null);
  assert.equal(latest.order.id, 1);
});

test("Shopify payment approval is checked before pending is mapped to the picking UI", async () => {
  fixture.config.platform = 'shopify';
  respond = (_request,response)=>json(response,{orders:[
    {...order(1),financial_status:'pending'},
    {...order(2),financial_status:'paid'},
    {...order(3),financial_status:'pending',confirmed:true,payment_terms:{payment_terms_type:'net',due_in_days:30}},
    {...order(4),financial_status:'paid',cancelled_at:'2026-09-28'},
  ]});
  const page = await service.getFilteredOrdersPage('pending');
  assert.deepEqual(page.orders.map(({id})=>id), [2,3]);
  assert.equal(page.orders[0].status, 'pending');
});
