import {
  stateStore, readState, blLogin, blFetchRecent,
  selectPending, normalizePhone, buildMessage, sendWhatsApp, appendHistory,
} from './lib/locker-core.mjs';
import { notificationKey, pendingNoteKey } from './lib/locker-order-notes.mjs';

/**
 * Scheduled job (every 5 min): if the automation is ENABLED, poll BetterLockers
 * for newly-deposited packages and send each customer their pickup code on WhatsApp.
 *
 * On/off is controlled from the app via locker-notifier-control. When it is turned
 * ON, that endpoint records the current newest record id as the starting point, so
 * the automation always begins "from now forward" and never messages older packages.
 *
 * Recipients come from selectPending() in locker-core — the same function the dry-run
 * preview uses, so what the preview shows is exactly what gets sent here.
 *
 * Every one-time attempt (success or failure) is appended to the history blob, so
 * the app can show what happened without needing access to the Netlify logs.
 * A record is marked handled BEFORE GreenAPI is called. This deliberately provides
 * at-most-once delivery: failures are never retried, preventing duplicate messages.
 */

export const config = { schedule: '*/5 * * * *' };

// A durable snapshot is created before sending. Never rebuild text during note retries.
export async function notifyRecord(rec, store, send = sendWhatsApp, at = new Date()) {
  const id = Number(rec.id);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('מזהה רשומת לוקר אינו תקין');
  const entry = { id, orderNumber: String(rec.order_number), phone: normalizePhone(rec.get_user_mobile),
    code: String(rec.pick_code), box: String(rec.box_name), address: rec.device_address,
    preparedAt: at.toISOString(), sentAt: at.toISOString(), message: buildMessage(rec, at), sendStatus: 'sending' };
  // Use set: this SDK version's setJSON drops conditional-write headers.
  const claimed = await store.set(notificationKey(id), JSON.stringify(entry), { onlyIfNew: true });
  if (!claimed.modified) return null;
  if (!claimed.etag) throw new Error('לא התקבל אישור שמירת הודעת הלוקר');
  await store.set(pendingNoteKey(id), String(id));
  let result;
  try {
    const response = await send(entry.phone, entry.message);
    result = { ...entry, ok: true, sendStatus: 'sent', idMessage: response.idMessage };
  } catch (error) {
    result = { ...entry, ok: false, sendStatus: 'failed', error: error.message };
  }
  // A storage failure leaves a durable unconfirmed snapshot, never a second send.
  await store.setJSON(notificationKey(id), result);
  return result;
}

export default async function handler() {
  const state = await readState();
  const store = stateStore();

  if (!state.enabled) {
    console.log('Automation disabled — nothing sent.');
    return new Response(JSON.stringify({ enabled: false, sent: 0 }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { token, marketMobile } = await blLogin();
  const records = await blFetchRecent(token, marketMobile);
  const pending = selectPending(records, { lastSeenId: state.lastSeenId });

  console.log(`Run start | enabled since ${state.enabledAt} | lastSeenId=${state.lastSeenId} | pending=${pending.length}`);

  const results = [];
  const historyEntries = [];
  let newLastSeen = state.lastSeenId;
  for (const rec of pending) {
    const recordId = Number(rec.id);

    // Claim the record before contacting GreenAPI. If the request fails or the
    // function stops afterwards, this record is intentionally never sent again.
    await store.set('lastSeenId', String(recordId));
    newLastSeen = recordId;

    try {
      const entry = await notifyRecord(rec, store);
      if (!entry) continue;
      results.push({ id: recordId, ok: entry.ok });
      historyEntries.push(entry);
    } catch (err) {
      console.error(`FAILED locker record ${recordId}`);
      results.push({ id: recordId, ok: false });
      historyEntries.push({ id: recordId, orderNumber: rec.order_number, sentAt: new Date().toISOString(), ok: false, error: err.message });
    }
  }

  await appendHistory(historyEntries);

  const sentCount = results.filter((r) => r.ok).length;

  console.log(`Run done | attempted=${pending.length} sent=${sentCount} lastSeenId=${newLastSeen}`);
  return new Response(JSON.stringify({ enabled: true, attempted: pending.length, sent: sentCount, lastSeenId: newLastSeen }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
