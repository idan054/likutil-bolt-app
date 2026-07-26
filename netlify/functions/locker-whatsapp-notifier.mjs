import {
  stateStore, readState, blLogin, blFetchRecent,
  selectPending, normalizePhone, buildMessage, sendWhatsApp, appendHistory,
} from './lib/locker-core.mjs';

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

export default async function handler() {
  const state = await readState();

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
  const store = stateStore();
  let newLastSeen = state.lastSeenId;
  for (const rec of pending) {
    const recordId = Number(rec.id);
    const phone = normalizePhone(rec.get_user_mobile);
    const entry = {
      sentAt: new Date().toISOString(),
      id: recordId,
      orderNumber: rec.order_number,
      phone,
      code: rec.pick_code,
      box: rec.box_name,
    };

    // Claim the record before contacting GreenAPI. If the request fails or the
    // function stops afterwards, this record is intentionally never sent again.
    await store.set('lastSeenId', String(recordId));
    newLastSeen = recordId;

    try {
      await sendWhatsApp(phone, buildMessage(rec));
      console.log(`SENT → ${phone} | order ${rec.order_number} | code ${rec.pick_code}`);
      results.push({ id: recordId, ok: true });
      historyEntries.push({ ...entry, ok: true });
    } catch (err) {
      console.error(`FAILED order ${rec.order_number} → ${phone}: ${err.message}`);
      results.push({ id: recordId, ok: false });
      historyEntries.push({ ...entry, ok: false, error: err.message });
    }
  }

  await appendHistory(historyEntries);

  const sentCount = results.filter((r) => r.ok).length;

  console.log(`Run done | attempted=${pending.length} sent=${sentCount} lastSeenId=${newLastSeen}`);
  return new Response(JSON.stringify({ enabled: true, attempted: pending.length, sent: sentCount, lastSeenId: newLastSeen }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
