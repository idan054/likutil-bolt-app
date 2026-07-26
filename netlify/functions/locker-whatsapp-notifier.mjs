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
 * Every send (success or failure) is appended to the history blob, so the app can
 * show what actually went out without needing access to the Netlify logs.
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
  for (const rec of pending) {
    const phone = normalizePhone(rec.get_user_mobile);
    const entry = {
      sentAt: new Date().toISOString(),
      id: Number(rec.id),
      orderNumber: rec.order_number,
      phone,
      code: rec.pick_code,
      box: rec.box_name,
    };
    try {
      await sendWhatsApp(phone, buildMessage(rec));
      console.log(`SENT → ${phone} | order ${rec.order_number} | code ${rec.pick_code}`);
      results.push({ id: Number(rec.id), ok: true });
      historyEntries.push({ ...entry, ok: true });
    } catch (err) {
      console.error(`FAILED order ${rec.order_number} → ${phone}: ${err.message}`);
      results.push({ id: Number(rec.id), ok: false });
      historyEntries.push({ ...entry, ok: false, error: err.message });
    }
  }

  await appendHistory(historyEntries);

  // Advance the watermark only past records we actually sent, so a transient
  // failure is retried next run instead of being skipped.
  const okIds = results.filter((r) => r.ok).map((r) => r.id);
  let newLastSeen = state.lastSeenId;
  if (okIds.length) {
    newLastSeen = Math.max(state.lastSeenId, ...okIds);
    await stateStore().set('lastSeenId', String(newLastSeen));
  }

  console.log(`Run done | pending=${pending.length} sent=${okIds.length} lastSeenId=${newLastSeen}`);
  return new Response(JSON.stringify({ enabled: true, pending: pending.length, sent: okIds.length, lastSeenId: newLastSeen }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
