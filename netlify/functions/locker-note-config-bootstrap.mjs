import { createHash, timingSafeEqual } from 'node:crypto';
import { configStore, readHistory, readRuntimeConfig, stateStore } from './lib/locker-core.mjs';
import { wooConnection, notificationKey, pendingNoteKey, flushPendingNotes } from './lib/locker-order-notes.mjs';
// Temporary, single-use configuration migration. Removed after verification.
export default async function handler(req) {
  if (req.method !== 'POST' || Date.now() > 1791214699292) return new Response(null, { status: 404 });
  const hash = createHash('sha256').update(req.headers.get('x-bootstrap-token') || '').digest();
  if (!timingSafeEqual(hash, Buffer.from('cee9f01f95acacd7c4583dfca52ab50914042e2eadf6a0da98426875b2b594b6', 'hex'))) return new Response(null, { status: 401 });
  const config = await req.json();
  if (config.action === 'verify-existing-message') {
    const entry = (await readHistory()).find(e => String(e.orderNumber) === String(config.orderNumber) && e.ok);
    if (!entry) return Response.json({ error: 'No successful history entry' }, { status: 404 });
    const runtime = await readRuntimeConfig();
    const response = await fetch(`${runtime.greenApiUrl}/waInstance${runtime.greenApiInstance}/lastOutgoingMessages/${runtime.greenApiToken}?minutes=1440`, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return Response.json({ error: 'Provider history unavailable' }, { status: 502 });
    const messages = await response.json();
    const message = messages.find(m => m.type === 'outgoing' && m.sendByApi && m.chatId === `${entry.phone}@c.us` &&
      m.caption?.includes(String(entry.orderNumber)) && m.caption?.includes(String(entry.code)) &&
      Math.abs(m.timestamp * 1000 - Date.parse(entry.sentAt)) < 10 * 60_000);
    if (!message) return Response.json({ error: 'No exact provider message found' }, { status: 404 });
    const snapshot = { ...entry, message: message.caption, idMessage: message.idMessage, sendStatus: 'sent', preparedAt: entry.sentAt };
    const store = stateStore();
    await store.setJSON(notificationKey(entry.id), snapshot, { onlyIfNew: true });
    await store.set(pendingNoteKey(entry.id), String(entry.id));
    const result = await flushPendingNotes(store);
    const saved = await store.get(notificationKey(entry.id), { type: 'json' });
    return Response.json({ ...result, orderNumber: entry.orderNumber, noteId: saved.noteId, error: saved.noteError,
      exactProviderText: saved.message === message.caption, containsCode: saved.message.includes(String(entry.code)) });
  }
  try { wooConnection(config); } catch { return new Response(null, { status: 400 }); }
  const result = await configStore().setJSON('order-notes', {
    LOCKER_WOO_URL: config.LOCKER_WOO_URL,
    LOCKER_WOO_KEY: config.LOCKER_WOO_KEY,
    LOCKER_WOO_SECRET: config.LOCKER_WOO_SECRET,
  }, { onlyIfNew: true });
  return Response.json({ configured: result.modified }, { status: result.modified ? 200 : 409 });
}
