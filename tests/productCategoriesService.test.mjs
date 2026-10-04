import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let viteServer;
let getProductCategoriesByIds;

before(async () => {
  viteServer = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  ({ getProductCategoriesByIds } = await viteServer.ssrLoadModule(
    "/src/services/fastDelivery/product-categories.service.ts"
  ));
});

after(async () => {
  await viteServer?.close();
});

test("category lookup deduplicates product IDs and normalizes the public WooCommerce response", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    return new Response(
      JSON.stringify([
        {
          id: 10,
          categories: [
            { id: 5919, name: " מדפסות תלת מימד ", slug: "3d-printers" },
          ],
        },
      ]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const result = await getProductCategoriesByIds("catalog-a.invalid", [10, 10, 11]);

    assert.equal(requests.length, 1);
    assert.match(requests[0], /include=10%2C11/);
    assert.deepEqual(result.get(10), [
      { id: 5919, name: "מדפסות תלת מימד", slug: "3d-printers" },
    ]);
    assert.equal(result.get(11), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("category lookup retries the www origin and caches a successful response", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    if (requests.length === 1) {
      throw new TypeError("redirect blocked by CORS");
    }
    return new Response(
      JSON.stringify([{ id: 20, categories: [{ id: 5654, name: "Accessories" }] }]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const first = await getProductCategoriesByIds("catalog-b.invalid", [20]);
    const second = await getProductCategoriesByIds("catalog-b.invalid", [20]);

    assert.equal(requests.length, 2);
    assert.match(requests[1], /^https:\/\/www\.catalog-b\.invalid\//);
    assert.deepEqual(first.get(20), [{ id: 5654, name: "Accessories" }]);
    assert.deepEqual(second.get(20), [{ id: 5654, name: "Accessories" }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("category lookup also retries the bare origin when the configured URL contains www", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    if (requests.length === 1) {
      return new Response("unavailable", { status: 503 });
    }
    return new Response(
      JSON.stringify([{ id: 21, categories: [{ id: 5919, name: "Machines" }] }]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const result = await getProductCategoriesByIds("www.catalog-d.invalid", [21]);

    assert.equal(requests.length, 2);
    assert.match(requests[1], /^https:\/\/catalog-d\.invalid\//);
    assert.deepEqual(result.get(21), [{ id: 5919, name: "Machines" }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("category lookup fails closed when neither origin returns usable data", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });

  try {
    await assert.rejects(
      getProductCategoriesByIds("catalog-c.invalid", [30]),
      /HTTP 503/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
