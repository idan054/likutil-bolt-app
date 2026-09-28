import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createServer as createHttpServer } from "node:http";
import { createServer } from "vite";
import React from "react";
import { act, create } from "react-test-renderer";

// Render the actual order, status menu, delivery hook and shipping buttons.
// Only external account data and unrelated presentation components are replaced.
let vite, http, OrderDetails, renderer, requests, respond, tabs, resets, completions;
const fixture = { messages: [] };
const savedResponses = new Map();
const globals = Object.fromEntries(["window", "document", "localStorage", "sessionStorage", "status"]
  .map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
globalThis.__orderPrintingTest = fixture;
const json = (response, body, status = 200) => {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
};
const order = {
  id: 1, status: "processing", date_created: "2026-09-28T06:00:00",
  shipment_created_status: 's3-packed',
  line_items: [], shipping_lines: [], customer_id: 0, payment_method: "card",
  billing: { email: "test@example.invalid", phone: "0501234567" },
  shipping: { first_name: "Test", last_name: "Customer", city: "City", address_1: "Street 1" },
  s3_label_url: "https://store.example.invalid/label?action=s3_label&o=1&t=test-signature",
};
const delivery = { print_label: "https://carrier.example.invalid/label", track_number: "1234" };
const settle = async (predicate) => {
  const deadline = Date.now() + 2500;
  while (!predicate()) {
    if (Date.now() > deadline) assert.fail("Timed out waiting for order workflow");
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
  }
};
const button = (text) => renderer.root.findAllByType("button").find((node) =>
  node.findAllByType("span").some(({ children }) => children.includes(text)) || node.props.children === text);
const labelLinks = () => renderer.root.findAllByType("a").filter((node) =>
  node.findAllByType("span").some(({ children }) => children.includes("הדפסת מדבקה")));

before(async () => {
  globalThis.window = new EventTarget();
  window.history = { pushState() {} };
  globalThis.document = new EventTarget();
  // window.status exists in browsers (the pre-existing status menu references it).
  globalThis.status = "";
  globalThis.localStorage = { getItem: () => null, setItem() {} };
  globalThis.sessionStorage = { getItem: key => savedResponses.get(key) ?? null,
    setItem: (key,value) => savedResponses.set(key,value), removeItem: key => savedResponses.delete(key) };
  http = createHttpServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      requests.push({ method: request.method, url: request.url, body: body ? JSON.parse(body) : null });
      respond(request, response, body ? JSON.parse(body) : null);
    });
  });
  await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
  fixture.baseUrl = `http://127.0.0.1:${http.address().port}`;
  fixture.config = { platform: "woo", baseUrl: fixture.baseUrl, headers: { "Content-Type": "application/json" } };
  vite = await createServer({
    appType: "custom", logLevel: "silent", server: { middlewareMode: true },
    ssr: { noExternal: ["react-hot-toast", "react-firebase-hooks", "framer-motion"] },
    plugins: [{
      name: "printing-test-boundaries", enforce: "pre",
      resolveId(id) {
        if (["framer-motion", "react-firebase-hooks/auth", "react-hot-toast"].includes(id)) return `\0printing:${id}`;
      },
      load(id) {
        const path = id.replaceAll("\\", "/");
        if (id === "\0printing:framer-motion") return `
          import React from 'react'; export const AnimatePresence = ({children}) => children;
          export const motion = { div: ({children}) => React.createElement('div', null, children) };`;
        if (id === "\0printing:react-firebase-hooks/auth") return `export const useAuthState = () => [{uid:'test-user'}, false];`;
        if (id === "\0printing:react-hot-toast") return `
          const record = message => globalThis.__orderPrintingTest.messages.push(message);
          export const toast = { success: record, error: record };`;
        if (path.endsWith("/config/firebase.ts")) return `export const auth = { currentUser: {uid:'test-user'} };`;
        if (path.endsWith("/services/auth/woo-auth.ts")) return `export const BASE_URL = globalThis.__orderPrintingTest.baseUrl;`;
        if (path.endsWith("/services/api/config.ts")) return `export const getApiConfig = () => globalThis.__orderPrintingTest.config;`;
        if (path.endsWith("/services/settings/index.ts")) return `export const settingsStorage = { get: () => ({authType:'woo',storeUrl:globalThis.__orderPrintingTest.storeUrl}) };`;
        if (path.endsWith("/hooks/useSettings.ts")) return `export const useSettings = () => ({orderStatuses: [
          {slug:'processing', name:'Processing'}, {slug:'s3-packed', name:'Packed'}, {slug:'completed', name:'Completed'}, {slug:'on-hold', name:'Hold'}]});`;
        if (path.endsWith("/hooks/useCustomerDetails.ts")) return `export const useCustomerDetails = () => ({});`;
        if (path.endsWith("/hooks/useOrderFastDeliveryDecision.ts")) return `export const useOrderFastDeliveryDecision = () => ({decision:{deliveryType:'fast'}});`;
        if (path.endsWith("/store/useMessagingStore.ts")) return `const reset = () => {}; export const useMessagingStore = () => ({reset});`;
        if (path.endsWith("/hooks/delivery/useDeliveryCompanies.ts")) return `export const useDeliveryCompanies = () => ({companies:[{}]});`;
        if (path.endsWith("/hooks/settings/useDeliveryIntegrations.ts")) return `
          const integration = {provider:'mahirLi', name:'Carrier', isConnected:true, programType:'LION_WHEEL'};
          export const getKeysByProgramType = () => 'test-key';
          export const useDeliveryIntegrations = () => ({activeIntegrations:[integration],integrations:[integration],savedData:{}});`;
        if (path.endsWith("/AddDeliveryCompanyCard.tsx")) return `export const DeliveryProgramType = {UPS:'UPS'};`;
        if (path.endsWith("/utils/error.ts")) return `export const showErrorToast = error => globalThis.__orderPrintingTest.messages.push(error.message);`;
        for (const name of ["ShippingMethod", "CustomerNote", "OrderItems", "OrderSummary", "CustomerSection", "OrderNotes",
          "FastDeliveryDecisionCard", "LocalPickupAlert", "LocalPickupSection", "CompanyPrintDocuments",
          "DeliveryCarousel", "NonConnectedCompany", "CompanyLogo", "CompanyHeader", "PackageCounter", "ConnectionStatus", "CompanyLinks", "DeliveryAddress"]) {
          if (path.endsWith('/' + name + '.tsx')) return `export const ${name} = () => null;`;
        }
      },
    }],
  });
  ({ OrderDetails } = await vite.ssrLoadModule("/src/components/OrderDetails.tsx"));
});

beforeEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  renderer = null;
  requests = []; tabs = []; resets = 0; completions = 0; fixture.messages = [];
  savedResponses.clear(); fixture.storeUrl = 'test.invalid';
  fixture.config = { ...fixture.config, baseUrl: fixture.baseUrl + '/' + Math.random() };
  respond = (request, response, body) => {
    if (request.url.startsWith("/api/create-delivery")) json(response, delivery);
    else json(response, { ...order, status: body?.status ?? order.status });
  };
  window.open = () => {
    const tab = { closed: false, document: { body: {} }, location: { replace(url) { tab.url = url; } }, close() { tab.closed = true; } };
    tabs.push(tab);
    return tab;
  };
});

after(async () => {
  if (renderer) await act(async () => renderer.unmount());
  await vite?.close();
  http?.closeAllConnections();
  await new Promise((resolve) => http.close(resolve));
  for (const [key, descriptor] of Object.entries(globals)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
  delete globalThis.__orderPrintingTest;
});

const mount = async (currentOrder = order) => {
  await act(async () => { renderer = create(React.createElement(OrderDetails, {
    order: currentOrder, onReset: () => { resets++; }, onComplete: () => { completions++; },
  })); });
};
const ship = async () => {
  await act(async () => button("שגר משלוח בטיל!").props.onClick());
  await settle(() => labelLinks().length === 1 && !button("סיום").props.disabled);
};
const changeStatus = async (label = 'Packed') => {
  const badge = renderer.root.findAllByType("button").find(({ props }) => props.className?.includes("rounded-full text-sm font-medium"));
  await act(async () => badge.props.onClick());
  await act(async () => renderer.root.findAllByProps({ role: "menuitem" }).find(({ props }) => props.children === label).props.onClick());
};

test("carrier success immediately advances the store's shipment status after opening its independent label tab", async () => {
  await mount();
  await ship();
  const label = labelLinks()[0].props.href;
  assert.equal(resets, 1);
  assert.equal(completions, 1);
  assert.equal(labelLinks()[0].props.href, label);
  assert.equal(tabs.length, 1);
  assert.equal(new URL(tabs[0].url).searchParams.get("d"), "1234");
  assert.equal(tabs[0].closed, false);
  assert.deepEqual(requests.filter(({body})=>body?.status).map(({body})=>body.status), ['s3-packed']);
  // Finishing a retained print view must not send a second "completed" write.
  await act(async () => button("סיום").props.onClick());
  assert.equal(resets, 2);
  assert.equal(completions, 1);
  assert.equal(requests.filter(({body})=>body?.status).length, 1);
  assert.equal(requests.filter(({ url }) => url.startsWith("/api/create-delivery")).length, 1);
});

test("slow delivery reserves its label window immediately and repeated clicks send only once", async () => {
  let finish;
  respond = (request, response, body) => {
    if (request.url.startsWith("/api/create-delivery")) finish = () => json(response, delivery);
    else json(response, {...order,status:body?.status ?? order.status});
  };
  await mount();
  let pending;
  await act(async () => {
    const click = button("שגר משלוח בטיל!").props.onClick;
    pending = click();
    click();
    assert.equal(tabs.length, 1);
    assert.equal(tabs[0].url, undefined);
  });
  await settle(() => Boolean(finish));
  assert.equal(button("שגר משלוח בטיל!").props.disabled, true);
  assert.equal(resets, 0);
  await act(async () => { finish(); await pending; });
  await settle(() => Boolean(tabs[0].url));
  assert.equal(requests.filter(({ url }) => url.startsWith("/api/create-delivery")).length, 1);
  assert.equal(labelLinks().length, 1);
});

test("a blocked popup keeps a manual label link and the active order", async () => {
  window.open = () => null;
  await mount();
  await ship();
  assert.equal(resets, 0);
  assert.equal(labelLinks().length, 1);
  assert.equal(fixture.messages.some((message) => message.includes("הדפדפן חסם")), true);
});

test("a failed status update preserves the label and never closes the order", async () => {
  window.open = () => null;
  await mount();
  await ship();
  respond = (_request, response) => json(response, {message:'unavailable'}, 503);
  await changeStatus();
  assert.equal(resets, 0);
  assert.equal(labelLinks().length, 1);
});

test("a failed finish preserves the created shipment for printing and retrying completion", async () => {
  respond = (request,response,body) => {
    if (request.url.startsWith('/api/create-delivery')) return json(response,delivery);
    if (body?.status) return json(response,{message:'unavailable'},503);
    json(response,order);
  };
  await mount();
  await ship();
  assert.equal(renderer.root.findAllByProps({role:'alert'}).length,1);
  await act(async () => button("סיום").props.onClick());
  assert.equal(resets, 0);
  assert.equal(completions, 0);
  assert.equal(labelLinks().length, 1);
  assert.equal(button("שגר משלוח בטיל!"), undefined);
  respond = (_request, response) => json(response, { ...order, status: 's3-packed' });
  await act(async () => button("סיום").props.onClick());
  assert.equal(resets, 1);
  assert.equal(completions, 1);
  assert.equal(requests.filter(({ url }) => url.startsWith("/api/create-delivery")).length, 1);
});

test("delivery failure closes only the reserved window and leaves the order open", async () => {
  respond = (request, response) => request.method === 'GET'
    ? json(response, order) : json(response, {message:'unavailable'}, 503);
  await mount();
  await act(async () => button("שגר משלוח בטיל!").props.onClick());
  await settle(() => tabs[0]?.closed && !button("שגר משלוח בטיל!").props.disabled);
  assert.equal(resets, 0);
  assert.equal(labelLinks().length, 0);
  assert.equal(requests.length, 2);
});

test("an old open order cannot create a shipment after approval was revoked", async () => {
  respond = (_request, response) => json(response, {...order,status:'rfq-sent'});
  await mount();
  await act(async () => button("שגר משלוח בטיל!").props.onClick());
  await settle(() => tabs[0]?.closed && !button("שגר משלוח בטיל!").props.disabled);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, 'GET');
  assert.equal(labelLinks().length, 0);
  assert.equal(fixture.messages.some(message => /הצעת מחיר/.test(message)), true);
});

test("putting an order on hold closes the picking view even when company documents were not printed", async () => {
  await mount({...order, s3_print:{quote_id:100,invoices:[]}});
  await changeStatus('Hold');
  assert.equal(resets, 1);
  assert.equal(completions, 0);
});

test("an approval read failure sends no request to the carrier", async () => {
  respond = (_request, response) => json(response, {message:'unavailable'}, 503);
  await mount();
  await act(async () => button("שגר משלוח בטיל!").props.onClick());
  await settle(() => tabs[0]?.closed && !button("שגר משלוח בטיל!").props.disabled);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, 'GET');
});

test("a revoked approval cannot be bypassed by finishing an existing shipment", async () => {
  respond = (request,response,body) => {
    if (request.url.startsWith('/api/create-delivery')) return json(response,delivery);
    if (body?.status) return json(response,{message:'unavailable'},503);
    json(response,order);
  };
  await mount();
  await ship();
  const before = requests.length;
  respond = (_request, response) => json(response, {...order,status:'on-hold'});
  await act(async () => button("סיום").props.onClick());
  assert.equal(resets, 0);
  assert.equal(completions, 0);
  assert.equal(labelLinks().length, 1);
  assert.deepEqual(requests.slice(before).map(({method})=>method), ['GET']);
});

test("refresh recovers a confirmed shipment and retries only its status update", async () => {
  respond = (request,response,body) => {
    if (request.url.startsWith('/api/create-delivery')) return json(response,delivery);
    if (body?.status) return json(response,{message:'unavailable'},503);
    json(response,order);
  };
  await mount(); await ship();
  assert.equal(resets,0);
  const prior = requests.length;
  await act(async () => renderer.unmount());
  respond = (_request,response,body)=>json(response,{...order,status:body?.status ?? order.status});
  await mount();
  await settle(()=>completions===1);
  assert.equal(resets,0,'The restored print link must remain available');
  assert.equal(button('שגר משלוח בטיל!'),undefined);
  assert.equal(labelLinks().length,1);
  assert.equal(requests.slice(prior).some(({url})=>url.startsWith('/api/create-delivery')),false);
  assert.deepEqual(requests.slice(prior).filter(({body})=>body?.status).map(({body})=>body.status),['s3-packed']);
});

test("a saved shipment cannot be reused for the same order number in another store", async () => {
  await mount(); await ship();
  await act(async()=>renderer.unmount());
  fixture.storeUrl='another.invalid';
  const prior=requests.length;
  await mount();
  assert.ok(button('שגר משלוח בטיל!'));
  assert.equal(labelLinks().length,0);
  assert.equal(requests.length,prior);
});

test("a lost status response is reconciled by reading without recreating or repeating the shipment", async () => {
  let stored=order;
  respond=(request,response,body)=>{
    if(request.url.startsWith('/api/create-delivery')) return json(response,delivery);
    if(body?.status){stored={...order,status:body.status}; response.destroy();return;}
    json(response,stored);
  };
  await mount(); await ship();
  assert.equal(resets,1);
  assert.equal(completions,1);
  assert.equal(requests.filter(({body})=>body?.status).length,1);
  assert.equal(requests.filter(({url})=>url.startsWith('/api/create-delivery')).length,1);
});

test("legacy stores retain their existing completion policy", async () => {
  respond=(request,response,body)=>request.url.startsWith('/api/create-delivery')
    ? json(response,delivery) : json(response,{...order,shipment_created_status:undefined,status:body?.status ?? 'processing'});
  await mount({...order,shipment_created_status:undefined}); await ship();
  assert.deepEqual(requests.filter(({body})=>body?.status).map(({body})=>body.status),['completed']);
});

test("an advanced shipment status is preserved when a saved result is reopened", async () => {
  respond=(request,response)=>request.url.startsWith('/api/create-delivery')
    ? json(response,delivery) : json(response,{...order,status:'s3-in-transit',shipment_created_status:'s3-in-transit'});
  await mount(); await ship();
  assert.equal(completions,1);
  assert.equal(requests.filter(({body})=>body?.status).length,0);
});

test("another worker advancing the shipment during validation cannot be overwritten", async () => {
  let reads=0;
  respond=(request,response)=>{
    if(request.url.startsWith('/api/create-delivery')) return json(response,delivery);
    if(request.method==='GET') reads++;
    json(response, reads >= 3 ? {...order,status:'s3-in-transit',shipment_created_status:'s3-in-transit'} : order);
  };
  await mount(); await ship();
  assert.equal(completions,1);
  assert.equal(requests.filter(({body})=>body?.status).length,0);
});

test("switching stores during shipment status validation cannot write to the new store", async () => {
  let reads=0;
  respond=(request,response)=>{
    if(request.url.startsWith('/api/create-delivery')) return json(response,delivery);
    if(request.method==='GET' && ++reads===3) fixture.config={...fixture.config,baseUrl:fixture.baseUrl+'/other'};
    json(response,order);
  };
  await mount(); await ship();
  assert.equal(completions,0);
  assert.equal(requests.filter(({body})=>body?.status).length,0);
  assert.equal(renderer.root.findAllByProps({role:'alert'}).length,1);
});
