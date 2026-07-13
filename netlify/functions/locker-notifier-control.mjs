import {
  stateStore, readState, blLogin, blFetchRecent, maxRecordId,
} from './lib/locker-core.mjs';

/**
 * On/off control for the locker → WhatsApp automation. Called by the app toggle.
 *
 *   GET  → { enabled, enabledAt, lastSeenId }
 *   POST { enabled: true }  → turn ON. Sets the starting point to the CURRENT newest
 *                             record, so it begins from now forward (never retroactive).
 *   POST { enabled: false } → turn OFF.
 */

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async function handler(req) {
  const store = stateStore();

  if (req.method === 'GET') {
    return json(await readState());
  }

  if (req.method === 'POST') {
    let enable = false;
    try {
      const body = await req.json();
      enable = body?.enabled === true;
    } catch {
      return json({ error: 'invalid body' }, 400);
    }

    if (enable) {
      // Anchor the starting point to the newest record that exists right now,
      // so only packages deposited AFTER this moment get messaged.
      const { token, marketMobile } = await blLogin();
      const records = await blFetchRecent(token, marketMobile);
      const startId = maxRecordId(records);
      const now = new Date().toISOString();

      await Promise.all([
        store.set('lastSeenId', String(startId)),
        store.set('enabledAt', now),
        store.set('enabled', 'true'),
      ]);
      console.log(`Automation ENABLED from ${now}, starting after record id ${startId}.`);
    } else {
      await store.set('enabled', 'false');
      console.log('Automation DISABLED.');
    }

    return json(await readState());
  }

  return json({ error: 'method not allowed' }, 405);
}
