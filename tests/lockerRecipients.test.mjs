import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lockerRecipients, isOneDigitApart } from '../netlify/functions/lib/locker-recipients.mjs';
import { notifyRecord } from '../netlify/functions/locker-whatsapp-notifier.mjs';
import { noteText } from '../netlify/functions/lib/locker-order-notes.mjs';

const order = { id: 123, billing: { phone: '0501234567' } };
const rec = { id: 71, order_number: '123', get_user_mobile: '0529999999', pick_code: '001234', box_name: '09', device_address: 'Test Street 1' };
test('formatting, one replaced digit, missing digit and extra digit all produce just the order phone', () => {
  for (const phone of ['050-1234567', '501234567', '+972501234567', '00972501234567', '9720501234567',
    '0501234568', '050123467', '05012344567']) {
    assert.deepEqual(lockerRecipients({ ...rec, get_user_mobile: phone }, order).recipients, ['972501234567'], phone);
  }
  assert.equal(lockerRecipients({ ...rec, get_user_mobile: '0501234568' }, order).phoneDecision, 'corrected');
});
test('two distinct phones both receive the message, and empty locker phone uses the order', () => {
  assert.deepEqual(lockerRecipients(rec, order).recipients, ['972501234567', '972529999999']);
  assert.deepEqual(lockerRecipients({ ...rec, get_user_mobile: '' }, order).recipients, ['972501234567']);
  assert.throws(() => lockerRecipients(rec, { billing: {} }), /חסר או אינו תקין/);
});
test('single-digit comparison distinguishes two changed digits and handles repeated digits', () => {
  assert.equal(isOneDigitApart('12345', '12346'), true);
  assert.equal(isOneDigitApart('12345', '12367'), false);
  assert.equal(isOneDigitApart('1112', '11112'), true);
  assert.equal(isOneDigitApart('1234', '12345'), true);
});
test('both recipients are attempted independently and a partial success is recorded without resending', async () => {
  const records = new Map();
  const db = {
    async getWithMetadata(key) { return records.has(key) ? { data: records.get(key), etag: '1' } : null; },
    async set(key, value, options) {
      if (options?.onlyIfNew && records.has(key)) return { modified: false };
      records.set(key, value); return { modified: true, etag: '1' };
    },
    async setJSON(key, value) { records.set(key, JSON.stringify(value)); },
  };
  const calls = [];
  const send = async (phone, text) => {
    calls.push({ phone, text });
    if (phone === '972529999999') throw new Error('Provider rejected recipient');
    return { idMessage: 'receipt' };
  };
  const resolve = async r => lockerRecipients(r, order);
  const entry = await notifyRecord(rec, db, send, new Date(), resolve);
  assert.equal(entry.sendStatus, 'partial'); assert.equal(entry.ok, false);
  assert.equal(calls.length, 2); assert.equal(calls[0].text, calls[1].text);
  assert.match(noteText(entry), /נשלחה לחלק מהמספרים/);
  assert.match(noteText(entry), /972501234567: התקבל אישור שליחה/);
  assert.match(noteText(entry), /972529999999: השליחה נכשלה/);
  await notifyRecord(rec, db, send, new Date(), resolve);
  assert.equal(calls.length, 2);
});
test('order lookup failure cannot claim a notification or send its code', async () => {
  let wrote = false, sent = false;
  await assert.rejects(notifyRecord(rec, { getWithMetadata: async () => null, set: () => { wrote = true; } },
    async () => { sent = true; }, new Date(), async () => { throw new Error('Store unavailable'); }));
  assert.equal(wrote, false); assert.equal(sent, false);
});
