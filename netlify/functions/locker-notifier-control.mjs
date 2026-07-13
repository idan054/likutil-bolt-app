import {
  stateStore, readState, readRuntimeConfig, blLogin, blFetchRecent, maxRecordId,
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
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

async function authorize(req) {
  const authorization = req.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return { error: json({ error: 'unauthorized' }, 401) };

  const config = await readRuntimeConfig();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(config.firebaseApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: match[1] }),
    },
  );

  if (!response.ok) return { error: json({ error: 'unauthorized' }, 401) };

  const body = await response.json();
  const user = body.users?.[0];

  // Any signed-in Likutil user may control the automation — no email allow-list.
  if (!user) return { error: json({ error: 'unauthorized' }, 401) };

  return { user };
}

export default async function handler(req) {
  let authorization;
  try {
    authorization = await authorize(req);
  } catch (error) {
    console.error('Locker notifier authorization configuration failed:', error.message);
    return json({ error: 'service unavailable' }, 503);
  }
  if (authorization.error) return authorization.error;

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
