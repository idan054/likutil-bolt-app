import { createHash, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const EXPECTED_TOKEN_HASH = '76e828214036a3a37b2f281b03de3b4f9dd54f10f09e36274f9d9d5245ae169f';
const requiredFields = [
  'betterLockersUser',
  'betterLockersPass',
  'greenApiUrl',
  'greenApiInstance',
  'greenApiToken',
  'firebaseApiKey',
  'controlEmails',
];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const suppliedToken = req.headers.get('x-bootstrap-token') || '';
  const suppliedHash = createHash('sha256').update(suppliedToken).digest();
  const expectedHash = Buffer.from(EXPECTED_TOKEN_HASH, 'hex');
  if (suppliedHash.length !== expectedHash.length || !timingSafeEqual(suppliedHash, expectedHash)) {
    return json({ error: 'unauthorized' }, 401);
  }

  let config;
  try {
    config = await req.json();
  } catch {
    return json({ error: 'invalid body' }, 400);
  }

  if (
    requiredFields.some((key) => !config?.[key]) ||
    !Array.isArray(config.controlEmails) ||
    config.controlEmails.length === 0
  ) {
    return json({ error: 'incomplete configuration' }, 400);
  }

  const store = getStore({ name: 'locker-notifier-config', consistency: 'strong' });
  await store.setJSON('runtime', config);
  return json({ configured: true });
}
