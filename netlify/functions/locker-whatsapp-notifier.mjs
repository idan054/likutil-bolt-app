import {
  CONFIG, stateStore, readState, blLogin, blFetchRecent,
  normalizePhone, buildMessage, sendWhatsApp,
} from './lib/locker-core.mjs';

/**
 * Scheduled job (every 5 min): if the automation is ENABLED, poll BetterLockers
 * for newly-deposited packages and send each customer their pickup code on WhatsApp.
 *
 * On/off is controlled from the app via locker-notifier-control. When it is turned
 * ON, that endpoint records the current newest record id as the starting point, so
 * the automation always begins "from now forward" and never messages older packages.
 *
 * Two guards decide who gets a message:
 *   TIME — deposited within the last MAX_AGE_MINUTES (and not before it was enabled)
 *   ID   — id higher than the last one handled (no duplicates across overlapping runs)
 */

export const config = { schedule: CONFIG.SCHEDULE };

export default async function handler() {
  const state = await readState();

  if (!state.enabled) {
    console.log('Automation disabled — nothing sent.');
    return new Response(JSON.stringify({ enabled: false, sent: 0 }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  const windowStart = Date.now() - CONFIG.MAX_AGE_MINUTES * 60 * 1000;
  const enabledAtMs = state.enabledAt ? Date.parse(state.enabledAt) : 0;
  const cutoff = Math.max(windowStart, enabledAtMs || 0);

  const { token, marketMobile } = await blLogin();
  const records = await blFetchRecent(token, marketMobile);

  const fresh = records
    .filter((r) => {
      const depositedAt = Date.parse(r.save_time);
      return (
        Number(r.id) > state.lastSeenId &&
        !Number.isNaN(depositedAt) && depositedAt >= cutoff &&
        !r.get_time && r.pick_code && r.get_user_mobile
      );
    })
    .sort((a, b) => Number(a.id) - Number(b.id));

  console.log(`Run start | enabled since ${state.enabledAt} | lastSeenId=${state.lastSeenId} | fresh=${fresh.length}`);

  const results = [];
  for (const rec of fresh) {
    const phone = normalizePhone(rec.get_user_mobile);
    try {
      await sendWhatsApp(phone, buildMessage(rec));
      console.log(`SENT → ${phone} | order ${rec.order_number} | code ${rec.pick_code}`);
      results.push({ id: Number(rec.id), ok: true });
    } catch (err) {
      console.error(`FAILED order ${rec.order_number} → ${phone}: ${err.message}`);
      results.push({ id: Number(rec.id), ok: false });
    }
  }

  // Advance the watermark only past records we actually sent, so a transient
  // failure is retried next run instead of being skipped.
  const okIds = results.filter((r) => r.ok).map((r) => r.id);
  let newLastSeen = state.lastSeenId;
  if (okIds.length) {
    newLastSeen = Math.max(state.lastSeenId, ...okIds);
    await stateStore().set('lastSeenId', String(newLastSeen));
  }

  console.log(`Run done | fresh=${fresh.length} sent=${okIds.length} lastSeenId=${newLastSeen}`);
  return new Response(JSON.stringify({ enabled: true, fresh: fresh.length, sent: okIds.length, lastSeenId: newLastSeen }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
