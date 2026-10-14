import assert from 'node:assert/strict';
import { before, after, beforeEach, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { create, act } from 'react-test-renderer';

let vite, parse, eligibility, Component, renderer;
const originalWindow = globalThis.window, originalDocument = globalThis.document;
const record = { v:1, parent_id:41, parent_number:'1041', state:'awaiting_picker', amount_minor:1000, decimals:2, currency:'ILS', can_decide:true, no_separate_shipping:true, cancellation_policy:'manual' };
const fixture = { calls:[], answer: async () => record };
globalThis.__additionTest = fixture;
const tick = () => new Promise(resolve => setImmediate(resolve));
const order = { id:42, order_number:1042, billing:{first_name:'Test',last_name:'Customer'}, line_items:[{id:1,name:'Item',quantity:2}], s3_addition:record };
before(async () => {
  globalThis.window = { setTimeout, clearTimeout, setInterval:()=>1, clearInterval(){} };
  globalThis.document = { visibilityState:'visible' };
  vite=await createServer({appType:'custom',logLevel:'silent',server:{middlewareMode:true},plugins:[{
    name:'addition-api-boundary', enforce:'pre', load(id) {
      const path=id.replaceAll('\\','/');
      if(path.endsWith('/services/api/client.ts')) return `export const apiClient=async request=>{globalThis.__additionTest.calls.push(request);return globalThis.__additionTest.answer(request);};`;
      if(path.endsWith('/services/api/config.ts')) return `export const getApiConfig=()=>({platform:'woo'});`;
    }
  }]});
  ({parseLinkedAddition:parse}=await vite.ssrLoadModule('/src/services/orders/additions.service.ts'));
  eligibility=await vite.ssrLoadModule('/src/services/orders/eligibility.ts');
  ({LinkedAdditionDetails:Component}=await vite.ssrLoadModule('/src/components/order/LinkedAdditionDetails.tsx'));
});
beforeEach(async () => {
  if(renderer) await act(async()=>renderer.unmount());
  renderer=null;fixture.calls=[];fixture.answer=async()=>({...record});
});
after(async()=>{
  if(renderer)await act(async()=>renderer.unmount());
  await vite?.close();globalThis.window=originalWindow;globalThis.document=originalDocument;delete globalThis.__additionTest;
});
const mount=async()=>{await act(async()=>{renderer=create(React.createElement(Component,{order,onReset(){}}));await tick();});};
const button=text=>renderer.root.findAllByType('button').find(b=>b.children.includes(text));
test('malformed or unknown actionable contract fails closed',()=>{
  assert.equal(parse({...record,state:'surprise'}),null);
  assert.equal(parse({...record,parent_id:'41'}),null);
  assert.equal(parse({...record,no_separate_shipping:false}),null);
  assert.equal(parse({...record,amount_minor:1.5}),null);
  assert.ok(parse(record));
});
test('ordinary shipping and status paths reject additions even after completion',()=>{
  for(const status of ['pending','s3-addition','processing','completed']) {
    assert.throws(()=>eligibility.assertOrderReady({id:42,status,s3_addition:record},'woo'),/תוספת/);
  }
  assert.throws(()=>eligibility.assertOrderReady({id:42,status:'completed',payment_method:'s3_addition_icredit'},'woo'),/תוספת/);
  assert.doesNotThrow(()=>eligibility.assertOrderReady({id:41,status:'processing'},'woo'));
  assert.doesNotThrow(()=>eligibility.assertOrderReady({id:41,status:'pending',confirmed:true,financial_status:'paid'},'shopify'));
});
test('two large decisions only after fresh server read; no ordinary status controls',async()=>{
  await mount();
  assert.ok(button('אפשר לצרף'));assert.ok(button('אי אפשר לצרף'));
  assert.equal(fixture.calls[0].method,'GET');
  assert.equal(fixture.calls[0].cache,'no-store');
  assert.equal(renderer.root.findAllByType('select').length,0);
  assert.match(JSON.stringify(renderer.toJSON()),/אין לשלוח בנפרד/);
});
test('double click issues one POST, waits for server before reporting completion',async()=>{
  await mount();let finish;
  fixture.answer=request=>request.method==='POST'?new Promise(resolve=>{finish=resolve;}):Promise.resolve(record);
  const attach=button('אפשר לצרף');
  await act(async()=>{attach.props.onClick();attach.props.onClick();await tick();});
  assert.equal(fixture.calls.filter(c=>c.method==='POST').length,1);
  assert.equal(button('אי אפשר לצרף').props.disabled,true);
  assert.doesNotMatch(JSON.stringify(renderer.toJSON()),/אפשר לצרף את המוצרים לחבילה/);
  await act(async()=>{finish({...record,state:'completed',can_decide:false});await tick();});
  assert.equal(button('אפשר לצרף'),undefined);
  assert.match(JSON.stringify(renderer.toJSON()),/החיוב אושר/);
});
test('lost mutation response never retries payment; refresh reads durable result',async()=>{
  await mount();fixture.answer=async()=>{throw Error('lost response');};
  await act(async()=>{button('אפשר לצרף').props.onClick();await tick();});
  assert.equal(button('אפשר לצרף'),undefined);
  assert.match(JSON.stringify(renderer.toJSON()),/לא התקבלה תשובה ודאית/);
  fixture.answer=async()=>({...record,state:'completed',can_decide:false});
  await act(async()=>{button('רענון מצב התוספת').props.onClick();await tick();});
  assert.equal(fixture.calls.filter(c=>c.method==='POST').length,1);
  assert.equal(fixture.calls.at(-1).method,'GET');
  assert.match(JSON.stringify(renderer.toJSON()),/החיוב אושר/);
});
test('rejection uses dedicated endpoint and preserves visible cancellation',async()=>{
  await mount();fixture.answer=async()=>({...record,state:'rejected',can_decide:false});
  await act(async()=>{button('אי אפשר לצרף').props.onClick();await tick();});
  assert.deepEqual(fixture.calls.at(-1).body,{decision:'reject'});
  assert.equal(fixture.calls.at(-1).path,'/s3-additions/42');
  assert.match(JSON.stringify(renderer.toJSON()),/התוספת בוטלה/);
});
test('wrong parent or failed read never enables a decision',async()=>{
  fixture.answer=async()=>({...record,parent_id:99});await mount();
  assert.equal(button('אפשר לצרף'),undefined);
  assert.match(JSON.stringify(renderer.toJSON()),/לא ניתן לאמת/);
});

test('switching orders starts a fresh read and ignores a late result from the old order',async()=>{
  let oldResult, newResult;
  fixture.answer=request=>new Promise(resolve=>{
    if(request.path.endsWith('/42')) oldResult=resolve; else newResult=resolve;
  });
  await mount();
  const oldSignal=fixture.calls[0].signal;
  const next={...order,id:43,s3_addition:{...record,parent_id:51,parent_number:'1051'}};
  await act(async()=>{renderer.update(React.createElement(Component,{order:next,onReset(){}}));await tick();});
  assert.equal(oldSignal.aborted,true);
  assert.equal(fixture.calls.at(-1).path,'/s3-additions/43');
  await act(async()=>{oldResult({...record,state:'completed',can_decide:false});await tick();});
  assert.doesNotMatch(JSON.stringify(renderer.toJSON()),/החיוב אושר/);
  assert.equal(button('אפשר לצרף'),undefined);
  await act(async()=>{newResult(next.s3_addition);await tick();});
  assert.ok(button('אפשר לצרף'));
});

test('parent navigation uses the app callback, with a visible recoverable error',async()=>{
  let opens=0;
  await act(async()=>{
    renderer=create(React.createElement(Component,{order,onReset(){},onOpenParent:async()=>{opens++;throw Error('offline');}}));
    await tick();
  });
  await act(async()=>{button('פתיחת ההזמנה המקורית').props.onClick();await tick();});
  assert.equal(opens,1);
  assert.match(JSON.stringify(renderer.toJSON()),/לא ניתן לפתוח/);
  assert.equal(fixture.calls.filter(c=>c.method==='POST').length,0);
});
