import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let viteServer;
let getCompanyPrintActions;
let getCompanyPrintSignature;

before(async () => {
  viteServer = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });
  ({ getCompanyPrintActions, getCompanyPrintSignature } =
    await viteServer.ssrLoadModule("/src/utils/companyPrint.ts"));
});

after(async () => {
  await viteServer?.close();
});

const companyOrder = {
  type: "b2b_pick",
  quote_id: 85254,
  company: "חברה בע״מ",
  delivery_note: {
    exists: true,
    number: 169,
    print_url: "https://store.example.test/print?token=signed-note",
  },
  invoices: [{
    number: 10196,
    print_url: "https://invoices.example.test/pdf/signed-invoice",
  }],
  popup: {
    title: "כותרת מהשרת",
    lines: ["שורה מהשרת"],
  },
};

test("existing delivery note and each invoice use only their server links", () => {
  const actions = getCompanyPrintActions(companyOrder);
  assert.equal(actions.length, 2);
  assert.deepEqual(actions.map(({ label }) => label), [
    "🖨️ הדפס תעודת משלוח #169",
    "🖨️ הדפס חשבונית מס #10196",
  ]);
  assert.deepEqual(actions.map(({ url }) => url), [
    companyOrder.delivery_note.print_url,
    companyOrder.invoices[0].print_url,
  ]);
  assert.ok(actions.every(({ valid }) => valid));
});

test("an unissued note has its generation label and no invoice action when none exist", () => {
  const print = {
    ...companyOrder,
    delivery_note: { ...companyOrder.delivery_note, exists: false, number: null },
    invoices: [],
  };
  const actions = getCompanyPrintActions(print);
  assert.equal(actions.length, 1);
  assert.equal(actions[0].label, "📄 הפק והדפס תעודת משלוח");
  assert.equal(actions[0].createsDeliveryNote, true);
});

test("missing or unsafe print links remain unavailable", () => {
  const print = {
    ...companyOrder,
    delivery_note: { exists: true, number: null, print_url: "javascript:alert(1)" },
    invoices: [{ number: 10196, print_url: "" }],
  };
  assert.deepEqual(
    getCompanyPrintActions(print).map(({ valid }) => valid),
    [false, false]
  );
});

test("session approval changes for a new invoice and never stores signed URLs", () => {
  const original = getCompanyPrintSignature(companyOrder);
  const updated = getCompanyPrintSignature({
    ...companyOrder,
    invoices: [...companyOrder.invoices, {
      number: 10197,
      print_url: "https://invoices.example.test/pdf/another-signed-invoice",
    }],
  });
  assert.notEqual(updated, original);
  assert.ok(!original.includes("signed-note"));
  assert.ok(!original.includes("signed-invoice"));
});
