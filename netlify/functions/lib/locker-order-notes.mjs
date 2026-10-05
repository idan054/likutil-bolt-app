import { configStore, normalizePhone } from './locker-core.mjs';

const TIMEOUT = 20_000;
const LEASE_MS = 5 * 60_000;
export const notificationKey = id => `notifications/${id}`;
export const pendingNoteKey = id => `pending-notes/${id}`;

export function noteText(entry) {
  const status = entry.sendStatus === 'sent' ? 'נשלחה לוואטסאפ'
    : entry.sendStatus === 'partial' ? 'נשלחה לחלק מהמספרים'
    : entry.sendStatus === 'failed' ? 'השליחה לוואטסאפ נכשלה' : 'לא התקבל אישור שליחה לוואטסאפ';
  const decision = entry.phoneDecision === 'corrected' ? `תוקנה טעות במספר: ${entry.lockerPhone} ← ${entry.orderPhone}` : '';
  const recipients = (entry.deliveries || entry.recipients?.map(phone => ({ phone, sendStatus: 'unknown' })) || [])
    .map(d => `${d.phone}: ${d.sendStatus === 'sent' ? 'התקבל אישור שליחה' : d.sendStatus === 'failed' ? 'השליחה נכשלה' : 'ללא אישור שליחה'}`).join('\n');
  const details = [decision, recipients].filter(Boolean).join('\n');
  return `📱 הודעת לוקר — ${status}\n\n${entry.message}\n\n${details ? `${details}\n\n` : ''}אסמכתא: לוקר-${entry.id}`;
}

export function wooConnection(env = process.env) {
  const url = new URL(env.LOCKER_WOO_URL || 'https://missing.invalid');
  if (!env.LOCKER_WOO_URL || url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      !env.LOCKER_WOO_KEY || !env.LOCKER_WOO_SECRET) throw new Error('חסר חיבור לחנות עבור הערות הלוקר');
  return { url: url.toString().replace(/\/$/, ''), authorization: `Basic ${Buffer.from(`${env.LOCKER_WOO_KEY}:${env.LOCKER_WOO_SECRET}`).toString('base64')}` };
}

export async function readLockerOrder(orderNumber, connection, request = fetch, timeout = 5_000) {
  connection ||= wooConnection(await configStore().get('order-notes', { type: 'json' }) || {});
  const number = String(orderNumber || '').trim();
  if (!/^\d+$/.test(number)) throw new Error('מספר ההזמנה בלוקר דורש בדיקה ידנית');
  const signal = AbortSignal.timeout(timeout);
  const call = async (path, body) => {
    const res = await request(`${connection.url}/wp-json/wc/v3${path}`, {
      method: body ? 'POST' : 'GET', redirect: 'error', signal,
      headers: { Authorization: connection.authorization, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`שמירת הערת לוקר: החנות החזירה ${res.status}`);
    return res.json();
  };
  // The notifier is bound to one configured store. Never infer a store from customer input.
  let order;
  try { order = await call(`/orders/${number}`); } catch { /* Custom order numbers are resolved below. */ }
  if (String(order?.number) !== number) {
    const matches = (await call(`/orders?search=${encodeURIComponent(number)}&per_page=100`)).filter(o => String(o.number) === number);
    if (matches.length !== 1) throw new Error('לא נמצאה הזמנה יחידה התואמת למספר בלוקר');
    order = matches[0];
  }
  if (!/^\d+$/.test(String(order.id))) throw new Error('מזהה ההזמנה אינו תקין');
  return { order, call };
}

export async function saveLockerOrderNote(entry, connection, request = fetch, timeout = TIMEOUT) {
  if (!entry.message || /\{(?:code|box|address|time|order_number)\}/.test(entry.message)) throw new Error('נוסח הודעת הלוקר אינו מלא');
  const { order, call } = await readLockerOrder(entry.orderNumber, connection, request, timeout);
  const expectedPhone = entry.orderPhone || entry.phone;
  if ((entry.orderId && String(order.id) !== String(entry.orderId)) ||
      ![order.billing?.phone, order.shipping?.phone].some(phone => phone && normalizePhone(phone) === expectedPhone)) {
    throw new Error('מספר הטלפון בלוקר אינו תואם להזמנה; נדרשת בדיקה ידנית');
  }
  const path = `/orders/${order.id}/notes`;
  const marker = `אסמכתא: לוקר-${entry.id}`;
  const hasMarker = note => new RegExp(`${marker}(?:\\s|<|$)`).test(String(note));
  // Read every page before creating: a lost POST response must not create a duplicate.
  for (let page = 1; page <= 20; page++) {
    const notes = await call(`${path}?per_page=100&page=${page}`);
    if (!Array.isArray(notes)) throw new Error('החנות החזירה רשימת הערות לא תקינה');
    const found = notes.find(note => note.customer_note === false && hasMarker(note.note));
    if (found) return found.id;
    if (notes.length < 100) {
      const note = await call(path, { note: noteText(entry), customer_note: false });
      if (!note?.id || note.customer_note !== false || !hasMarker(note.note)) throw new Error('החנות לא אישרה שמירת הערה פנימית');
      return note.id;
    }
  }
  throw new Error('יש יותר מדי הערות להזמנה; נדרשת בדיקה ידנית');
}

export async function flushPendingNotes(store, saveNote = saveLockerOrderNote, now = Date.now()) {
  const deadline = Date.now() + 23_000;
  const { blobs } = await store.list({ prefix: 'pending-notes/' });
  let attempted = 0;
  let saved = 0;
  for (const { key } of blobs) {
    if (attempted >= 8 || Date.now() >= deadline - 2_000) break;
    const id = key.slice('pending-notes/'.length);
    const recordKey = notificationKey(id);
    const current = await store.getWithMetadata(recordKey, { type: 'json' });
    if (!current?.data) continue;
    const entry = current.data;
    if (entry.noteId) { await store.delete(key); continue; }
    if (entry.noteLeaseUntil > now || entry.noteRetryAfter > now ||
        (entry.sendStatus === 'sending' && now - Date.parse(entry.preparedAt) < 10 * 60_000)) continue;
    const leased = { ...entry, noteLeaseUntil: now + LEASE_MS };
    if (!current.etag) throw new Error('לא התקבל מזהה גרסת תיעוד הלוקר');
    const claim = await store.set(recordKey, JSON.stringify(leased), { onlyIfMatch: current.etag });
    if (!claim.modified) continue;
    if (!claim.etag) throw new Error('לא התקבל אישור נעילת תיעוד הלוקר');
    attempted++;
    try {
      const noteId = await saveNote(leased, undefined, undefined, Math.max(1, Math.min(TIMEOUT, deadline - Date.now())));
      await store.setJSON(recordKey, { ...leased, noteId, noteSavedAt: new Date().toISOString(), noteLeaseUntil: 0, noteError: null });
      await store.delete(key);
      saved++;
    } catch (error) {
      const attempts = (entry.noteAttempts || 0) + 1;
      await store.setJSON(recordKey, { ...leased, noteLeaseUntil: 0, noteAttempts: attempts,
        noteRetryAfter: now + Math.min(60, 5 * attempts) * 60_000, noteError: error.message });
      console.error(`Locker note pending for record ${id}`);
    }
  }
  return { attempted, saved };
}
