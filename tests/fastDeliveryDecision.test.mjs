import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let viteServer;
let buildFastDeliveryInputFingerprint;
let decideFastDelivery;
let shouldRecalculateAutomaticDecision;

before(async () => {
  viteServer = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  ({
    buildFastDeliveryInputFingerprint,
    decideFastDelivery,
    shouldRecalculateAutomaticDecision,
  } = await viteServer.ssrLoadModule("/src/services/fastDelivery/decide.ts"));
});

after(async () => {
  await viteServer?.close();
});

const rules = (overrides = {}) => ({
  storeKey: "test-store",
  cities: ["תל אביב", "עפולה"],
  blockedKeywords: ["מדפסת", "H2D"],
  blockedProductIds: [],
  blockedCategoryIds: [],
  blockedPriceThreshold: 2000,
  vipRoles: ["wholesale_customer"],
  updatedAt: "2026-08-09T10:00:00.000Z",
  ...overrides,
});

const item = (overrides = {}) => ({
  productId: 1,
  name: "מוצר רגיל",
  unitPrice: 100,
  categories: [{ id: 10, name: "עזרים ומשלימים" }],
  categoryDataComplete: true,
  ...overrides,
});

const decide = (overrides = {}) =>
  decideFastDelivery({
    isVipMember: true,
    customerRole: null,
    city: "עפולה",
    lineItems: [item()],
    rules: rules(),
    ...overrides,
  });

test("84457: a compound WooCommerce city matches its configured service-area alias", () => {
  const result = decide({
    city: "תל אביב - יפו",
    rules: rules({ blockedCategoryIds: [5919] }),
    lineItems: [item({ name: "פילמנט PLA", unitPrice: 69 })],
  });

  assert.equal(result.deliveryType, "fast");
  assert.equal(result.decisionState, "auto");
  assert.equal(result.checks.find((check) => check.label.includes("עיר"))?.ok, true);
});

test("84458: low-value printer accessories are not blocked when their categories are known", () => {
  const result = decide({
    rules: rules({ blockedCategoryIds: [5919] }),
    lineItems: [
      item({
        productId: 37572,
        name: "שפופרת גריז מיוחד למדפסות תלת מימד",
        unitPrice: 19,
        categories: [
          { id: 2342, name: "שדרוגים וחלפים למדפסות" },
          { id: 5654, name: "עזרים ומשלימים" },
        ],
      }),
      item({
        productId: 33685,
        name: "דבק סטיק ייעודי למדפסת תלת מימד",
        unitPrice: 19.9,
        categories: [{ id: 5654, name: "עזרים ומשלימים" }],
      }),
      item({
        productId: 6462,
        name: "מארז מחטים לניקוי דיזה מדפסת תלת מימד",
        unitPrice: 25,
        categories: [{ id: 2342, name: "שדרוגים וחלפים למדפסות" }],
      }),
    ],
  });

  assert.equal(result.deliveryType, "fast");
  assert.equal(result.decisionState, "auto");
  assert.equal(
    result.checks.find((check) => check.label.includes("מוצר חסום"))?.ok,
    true
  );
});

test("a printer category blocks the order even below the fallback price", () => {
  const result = decide({
    rules: rules({ blockedCategoryIds: [5919] }),
    lineItems: [
      item({
        name: "Model X",
        unitPrice: 1500,
        categories: [{ id: 5919, name: "מדפסות תלת מימד" }],
      }),
    ],
  });

  assert.equal(result.deliveryType, "regular");
  assert.match(
    result.checks.find((check) => check.label.includes("מוצר חסום"))?.detail ?? "",
    /קטגוריה/
  );
});

test("an explicit category or product ID blocks without relying on names", () => {
  const categoryResult = decide({
    rules: rules({ blockedKeywords: [], blockedCategoryIds: [5919] }),
    lineItems: [
      item({
        productId: 99,
        name: "Model X",
        categories: [{ id: 5919, name: "Machines" }],
      }),
    ],
  });
  const productResult = decide({
    rules: rules({ blockedKeywords: [], blockedProductIds: [99] }),
    lineItems: [item({ productId: 99, name: "Model X", categories: [] })],
  });

  assert.equal(categoryResult.deliveryType, "regular");
  assert.equal(productResult.deliveryType, "regular");
});

test("title and price are used only as a fallback when categories are unavailable", () => {
  const blocked = decide({
    lineItems: [
      item({
        name: "Bambu Lab H2D",
        unitPrice: 5000,
        categories: [],
        categoryDataComplete: false,
      }),
    ],
  });
  const knownAccessory = decide({
    rules: rules({ blockedCategoryIds: [5919] }),
    lineItems: [
      item({
        name: "AMS accessory for H2D",
        unitPrice: 2150,
        categories: [{ id: 5654, name: "Accessories" }],
        categoryDataComplete: true,
      }),
    ],
  });

  assert.equal(blocked.deliveryType, "regular");
  assert.equal(knownAccessory.deliveryType, "fast");
});

test("missing category evidence is surfaced for review instead of silently approving", () => {
  const result = decide({
    rules: rules({ blockedCategoryIds: [5919] }),
    lineItems: [
      item({
        name: "אביזר למדפסת",
        unitPrice: 100,
        categories: [],
        categoryDataComplete: false,
      }),
    ],
  });

  assert.equal(result.deliveryType, "regular");
  assert.equal(result.decisionState, "needs_review");
  assert.match(result.checks.at(-1)?.detail ?? "", /קטגוריה/);
});

test("city matching does not use unsafe partial-string matching", () => {
  const result = decide({
    city: "רמת גן",
    rules: rules({ cities: ["גן"] }),
  });

  assert.equal(result.deliveryType, "regular");
  assert.equal(result.checks.find((check) => check.label.includes("עיר"))?.ok, false);
});

test("the input fingerprint is stable when item and category order changes", () => {
  const first = buildFastDeliveryInputFingerprint({
    isVipMember: true,
    customerRole: null,
    city: "עפולה",
    lineItems: [
      item({ productId: 2, categories: [{ id: 2, name: "B" }, { id: 1, name: "A" }] }),
      item({ productId: 1 }),
    ],
  });
  const second = buildFastDeliveryInputFingerprint({
    isVipMember: true,
    customerRole: null,
    city: "עפולה",
    lineItems: [
      item({ productId: 1 }),
      item({ productId: 2, categories: [{ id: 1, name: "A" }, { id: 2, name: "B" }] }),
    ],
  });

  assert.equal(first, second);
});

test("automatic decisions refresh on rule/input changes while manual overrides remain stable", () => {
  const baseDecision = {
    storeKey: "test-store",
    orderId: 1,
    deliveryType: "regular",
    decisionState: "auto",
    override: false,
    checks: [],
    updatedAt: "2026-08-09T10:00:00.000Z",
    rulesUpdatedAt: "rules-v1",
    inputFingerprint: "input-v1",
  };

  assert.equal(
    shouldRecalculateAutomaticDecision({
      existing: baseDecision,
      rulesUpdatedAt: "rules-v1",
      inputFingerprint: "input-v1",
    }),
    false
  );
  assert.equal(
    shouldRecalculateAutomaticDecision({
      existing: baseDecision,
      rulesUpdatedAt: "rules-v2",
      inputFingerprint: "input-v1",
    }),
    true
  );
  assert.equal(
    shouldRecalculateAutomaticDecision({
      existing: { ...baseDecision, decisionState: "manual", override: true },
      rulesUpdatedAt: "rules-v2",
      inputFingerprint: "input-v2",
    }),
    false
  );
});
