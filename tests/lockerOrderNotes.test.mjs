import assert from 'node:assert/strict';
import { test } from 'node:test';
import { notifyRecord as notifyActualRecord } from '../netlify/functions/locker-whatsapp-notifier.mjs';
import { lockerRecipients } from '../netlify/functions/lib/locker-recipients.mjs';
import { buildMessage } from '../netlify/functions/lib/locker-core.mjs';
import { flushPendingNotes, saveLockerOrderNote, noteText, wooConnection } from '../netlify/functions/lib/locker-order-notes.mjs';

const rec = { id: 71, order_number: '123', get_user_mobile: '0501234567', pick_code: '001234', box_name: '09', device_address: 'Test Street 1' };
const at = new Date('2026-10-05T07:20:00Z');
const connection = { url: 'https://shop.invalid', authorization: 'Basic test' };
const notifyRecord = (record, db, send, when) => notifyActualRecord(record, db, send, when,
  async r => lockerRecipients(r, { id: 123, billing: { phone: rec.get_user_mobile } }));
// Test storage implements the external Blobs atomic-write contract, not product logic.
function store() {
  const records = new Map(); let revision = 0;
  return {
    records,
    async getWithMetadata(key) { return structuredClone(records.get(key) ?? null); },
    async setJSON(key, data, options = {}) {
      if ((options.onlyIfNew && records.has(key)) || (options.onlyIfMatch && records.get(key)?.etag !== options.onlyIfMatch)) return { modified: false };
      records.set(key, { data: structuredClone(data), etag: String(++revision) }); return { modified: true, etag: String(revision) };
    },
    async set(key, data, options) { return this.setJSON(key, key.startsWith('notifications/') ? JSON.parse(data) : data, options); },
    async delete(key) { records.delete(key); },
    async list({ prefix }) { return { blobs: [...records.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })) }; },
  };
}
function woo({ phone = rec.get_user_mobile, number = '123', id = 123, losePost = false } = {}) {
  const notes = []; const writes = []; const paths = [];
  const request = async (url, options) => {
    const path = new URL(url).pathname; paths.push(url);
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, connection.authorization);
    if (options.method === 'POST') {
      const body = JSON.parse(options.body); writes.push(body);
      notes.push({ ...body, id: notes.length + 1 });
      if (losePost) { losePost = false; throw new TypeError('Lost response'); }
      return Response.json(notes.at(-1));
    }
    if (path.endsWith('/notes')) return Response.json(notes);
    if (path.endsWith('/orders')) return Response.json([{ id, number, billing: { phone } }]);
    return Response.json({ id, number, billing: { phone } });
  };
  return { notes, writes, request, paths };
}

test('exact sent text, real numbers, leading zeroes and provider receipt are persisted as a private order note', async () => {
  const db = store(); let sent;
  const entry = await notifyRecord(rec, db, async (phone, message) => { sent = { phone, message }; return { idMessage: 'receipt-1' }; }, at);
  assert.equal(entry.message, sent.message);
  assert.equal(entry.phone, '972501234567');
  assert.equal(entry.idMessage, 'receipt-1');
  assert.match(entry.message, /001234/); assert.match(entry.message, /09/);
  assert.doesNotMatch(entry.message, /\{(?:code|box|time|address|order_number)\}/);
  const api = woo();
  assert.deepEqual(await flushPendingNotes(db, e => saveLockerOrderNote(e, connection, api.request)), { attempted: 1, saved: 1 });
  assert.equal(api.writes[0].customer_note, false);
  assert.equal(api.writes[0].note, noteText(entry));
  assert.ok(api.writes[0].note.includes(sent.message));
  assert.equal(db.records.get('notifications/71').data.noteId, 1);
  assert.equal(db.records.has('pending-notes/71'), false);
});

test('parallel scheduled invocations send once and write one note', async () => {
  const db = store(); let calls = 0; const send = async () => { calls++; return { idMessage: 'one' }; };
  await Promise.all(Array.from({ length: 8 }, () => notifyRecord(rec, db, send, at)));
  assert.equal(calls, 1);
  const api = woo(); const save = e => saveLockerOrderNote(e, connection, api.request);
  await Promise.all([flushPendingNotes(db, save), flushPendingNotes(db, save)]);
  assert.equal(api.writes.length, 1);
});

test('failed sends keep the complete text, explicitly marked failed, without resending', async () => {
  const db = store(); let calls = 0;
  const send = async () => { calls++; throw new Error('Carrier rejected'); };
  const entry = await notifyRecord(rec, db, send, at);
  assert.equal(entry.sendStatus, 'failed'); assert.equal(entry.ok, false);
  assert.match(noteText(entry), /השליחה לוואטסאפ נכשלה/);
  assert.match(noteText(entry), /001234/);
  await notifyRecord(rec, db, send, at); assert.equal(calls, 1);
  const api = woo(); await flushPendingNotes(db, e => saveLockerOrderNote(e, connection, api.request));
  assert.equal(api.writes.length, 1);
});

test('note failure retries only the immutable note, even with a changed clock or locker record', async () => {
  const db = store(); let calls = 0;
  const send = async () => { calls++; return { idMessage: 'one' }; };
  const original = await notifyRecord(rec, db, send, at);
  const now = at.getTime() + 60_000;
  await flushPendingNotes(db, async () => { throw new Error('Store unavailable'); }, now);
  await notifyRecord({ ...rec, pick_code: '999999' }, db, send, new Date());
  let note;
  await flushPendingNotes(db, async e => { note = e.message; return 12; }, now + 6 * 60_000);
  assert.equal(calls, 1); assert.equal(note, original.message);
});

test('a lost Woo POST response is reconciled without duplicating the note', async () => {
  const db = store(); await notifyRecord(rec, db, async () => ({ idMessage: 'one' }), at);
  const api = woo({ losePost: true }); const save = e => saveLockerOrderNote(e, connection, api.request);
  await flushPendingNotes(db, save, at.getTime());
  assert.equal(api.writes.length, 1);
  await flushPendingNotes(db, save, at.getTime() + 6 * 60_000);
  assert.equal(api.writes.length, 1); assert.equal(db.records.get('notifications/71').data.noteId, 1);
});

test('worker crash cannot claim a send succeeded and cannot resend the same record', async () => {
  const db = store(); const setJSON = db.setJSON.bind(db);
  db.setJSON = async (key, entry, options) => {
    if (entry.sendStatus === 'sent') throw new Error('Storage unavailable');
    return setJSON(key, entry, options);
  };
  let calls = 0; const send = async () => { calls++; return { idMessage: 'one' }; };
  await assert.rejects(notifyRecord(rec, db, send, at));
  await notifyRecord(rec, db, send, at); assert.equal(calls, 1);
  let note;
  await flushPendingNotes(db, async e => { note = noteText(e); return 1; }, at.getTime() + 11 * 60_000);
  assert.match(note, /לא התקבל אישור/); assert.match(note, /001234/);
});

test('notes are never added to a mismatched customer and numeric custom order numbers are resolved exactly', async () => {
  const entry = await notifyRecord(rec, store(), async () => ({ idMessage: 'one' }), at);
  const wrong = woo({ phone: '0509999999' });
  await assert.rejects(saveLockerOrderNote(entry, connection, wrong.request), /אינו תואם/);
  assert.equal(wrong.writes.length, 0);
  const custom = woo({ id: 42 });
  await saveLockerOrderNote({ ...entry, orderId: 42 }, connection, custom.request);
  assert.ok(custom.paths.some(path => path.includes('/orders/42/notes')));
});

test('unresolved variables and missing locker data cannot be sent or saved', async () => {
  for (const field of ['order_number', 'device_address', 'box_name', 'pick_code']) {
    assert.throws(() => buildMessage({ ...rec, [field]: '' }), /אינם מלאים/);
    assert.throws(() => buildMessage({ ...rec, [field]: '{code}' }), /אינם מלאים/);
  }
  let calls = 0;
  await assert.rejects(notifyRecord({ ...rec, pick_code: '{code}' }, store(), async () => { calls++; }, at));
  assert.equal(calls, 0);
  await assert.rejects(saveLockerOrderNote({ message: '{code}' }, connection, () => { throw new Error('must not call'); }), /אינו מלא/);
});

test('missing server store configuration fails without sending credentials to another origin', () => {
  assert.throws(() => wooConnection({}), /חסר חיבור/);
  assert.throws(() => wooConnection({ LOCKER_WOO_URL: 'http://shop.invalid', LOCKER_WOO_KEY: 'key', LOCKER_WOO_SECRET: 'secret' }), /חסר חיבור/);
});

test('different locker record numbers cannot collide during duplicate detection', async () => {
  const entry = await notifyRecord(rec, store(), async () => ({ idMessage: 'one' }), at);
  const api = woo();
  api.notes.push({ id: 100, customer_note: false, note: 'אסמכתא: לוקר-710' });
  await saveLockerOrderNote(entry, connection, api.request);
  assert.equal(api.writes.length, 1);
});

test('all Woo requests share one deadline rather than resetting the timeout per page', async () => {
  const entry = await notifyRecord(rec, store(), async () => ({ idMessage: 'one' }), at);
  const api = woo(); const signals = [];
  await saveLockerOrderNote(entry, connection, async (url, options) => {
    signals.push(options.signal);
    return api.request(url, options);
  });
  assert.ok(signals.length >= 3);
  assert.equal(new Set(signals).size, 1);
});


test('installed Blobs SDK sends conditional headers on the production claim path', async () => {
  const { getStore } = await import('@netlify/blobs');
  const values = new Map();
  const db = getStore({ name: 'test', siteID: 'test-site', token: 'test-token', edgeURL: 'https://blob.invalid',
    fetch: async (url, options) => {
      const headers = new Headers(options.headers); const key = new URL(url).pathname;
      if (options.method.toLowerCase() === 'get') return new Response(values.get(key) || null, { status: values.has(key) ? 200 : 404, headers: { etag: 'stored-revision' } });
      if (headers.get('if-none-match') === '*' && values.has(key)) return new Response(null, { status: 412 });
      if (key.endsWith('/notifications/71') && !values.has(key)) assert.equal(headers.get('if-none-match'), '*');
      values.set(key, options.body);
      return new Response(null, { status: 200, headers: { etag: 'stored-revision' } });
    },
  });
  let sent = 0;
  await notifyRecord(rec, db, async () => { sent++; return { idMessage: 'one' }; }, at);
  assert.equal(await notifyRecord(rec, db, async () => { sent++; }, at), null);
  assert.equal(sent, 1);
});
