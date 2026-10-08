import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let viteServer;
let providerForSiteCarrier;
let siteCarrierForProvider;
let preferredSiteProvider;
let siteDeliveryType;

before(async () => {
  viteServer = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ providerForSiteCarrier, siteCarrierForProvider, preferredSiteProvider, siteDeliveryType } =
    await viteServer.ssrLoadModule("/src/utils/siteCarrier.ts"));
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

test("fast or regular follows the site only when it decided", () => {
  assert.equal(siteDeliveryType({ use: "zipgo" }), "fast");
  assert.equal(siteDeliveryType({ use: "mahirli" }), "fast");
  assert.equal(siteDeliveryType({ use: "negev" }), "regular");
  assert.equal(siteDeliveryType({ use: "" }), null);
  assert.equal(siteDeliveryType(null), null);
  assert.equal(siteDeliveryType(undefined), null);
});
