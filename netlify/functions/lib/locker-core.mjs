// Shared core for the locker → WhatsApp automation.
// Imported by both the scheduled sender and the on/off control endpoint.
// (This file lives in a subfolder, so Netlify does NOT publish it as its own function.)
import { getStore } from '@netlify/blobs';
import { renderLockerMessage } from '../../../src/config/lockerMessageTemplate.js';

export const CONFIG = {
  // How far back a run looks (also tolerates a few missed 5-min runs).
  MAX_AGE_MINUTES: 20,
  SCHEDULE: '*/5 * * * *',
};

const BL_BASE = 'https://admin.betterlockers.com/api/api';

// --- Persistent state (Netlify Blobs) -----------------------------------

export function stateStore() {
  return getStore({ name: 'locker-notifier', consistency: 'strong' });
}

export function configStore() {
  return getStore({ name: 'locker-notifier-config', consistency: 'strong' });
}

export async function readRuntimeConfig() {
  const config = await configStore().get('runtime', { type: 'json' });
  const required = [
    'betterLockersUser',
    'betterLockersPass',
    'greenApiUrl',
    'greenApiInstance',
    'greenApiToken',
    'firebaseApiKey',
  ];

  if (!config || required.some((key) => !config[key])) {
    throw new Error('Locker notifier runtime configuration is incomplete.');
  }

  return config;
}

export async function readState() {
  const store = stateStore();
  const [enabled, enabledAt, lastSeenId] = await Promise.all([
    store.get('enabled'),
    store.get('enabledAt'),
    store.get('lastSeenId'),
  ]);
  return {
    enabled: enabled === 'true',
    enabledAt: enabledAt || null,
    lastSeenId: Number(lastSeenId) || 0,
  };
}

// --- Send history --------------------------------------------------------
// Persisted so the app can show what actually went out; the Netlify function
// logs are not reachable from the app's Netlify account.

const HISTORY_LIMIT = 50;

export async function readHistory() {
  return (await stateStore().get('history', { type: 'json' })) || [];
}

export async function appendHistory(entries) {
  if (!entries?.length) return;
  const previous = await readHistory();
  const next = [...entries, ...previous].slice(0, HISTORY_LIMIT);
  await stateStore().set('history', JSON.stringify(next));
}

// --- BetterLockers API ---------------------------------------------------

export async function blLogin() {
  const config = await readRuntimeConfig();
  const res = await fetch(`${BL_BASE}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: config.betterLockersUser,
      password: config.betterLockersPass,
    }),
  });
  const json = await res.json();
  if (json.code !== 0 || !json.data?.token) {
    throw new Error(`BetterLockers login failed: ${json.code} ${json.msg}`);
  }
  return { token: json.data.token, marketMobile: json.data.phone };
}

export async function blFetchRecent(token, marketMobile, pageSize = 50) {
  const res = await fetch(`${BL_BASE}/record-ab-used/index`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authorization: token },
    body: JSON.stringify({
      market_mobile: marketMobile,
      device_number: '', pick_code: '', save_user_mobile: '', get_user_mobile: '',
      used_status: '', order_number: '', start_time: '', end_time: '',
      page: 1, page_size: pageSize, order_column_name: '', order_type: '',
    }),
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(`BetterLockers list failed: ${json.code} ${json.msg}`);
  return json.data?.list ?? [];
}

export function maxRecordId(records, floor = 0) {
  return records.reduce((m, r) => Math.max(m, Number(r.id) || 0), floor);
}

// --- Who gets a message (single source of truth) --------------------------
// Used by BOTH the real sender and the dry-run preview, so what the preview
// shows can never drift from what actually gets sent.

export function computeCutoff(state) {
  const windowStart = Date.now() - CONFIG.MAX_AGE_MINUTES * 60 * 1000;
  const enabledAtMs = state.enabledAt ? Date.parse(state.enabledAt) : 0;
  return Math.max(windowStart, enabledAtMs || 0);
}

export function selectPending(records, { lastSeenId = 0, cutoff = 0 } = {}) {
  return records
    .filter((r) => {
      const depositedAt = Date.parse(r.save_time);
      return (
        Number(r.id) > lastSeenId &&
        !Number.isNaN(depositedAt) && depositedAt >= cutoff &&
        !r.get_time && r.pick_code && r.get_user_mobile
      );
    })
    .sort((a, b) => Number(a.id) - Number(b.id));
}

// Shape a record for display in the dry-run preview.
export function describeRecord(rec) {
  return {
    id: Number(rec.id),
    orderNumber: rec.order_number,
    phone: normalizePhone(rec.get_user_mobile),
    code: rec.pick_code,
    box: rec.box_name,
    address: rec.device_address,
    savedAt: depositTimeText(rec),
    message: buildMessage(rec),
  };
}

// --- Message building ----------------------------------------------------

// BetterLockers stores phones as "972" + local-with-leading-zero (e.g. 9720504685161).
export function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('9720')) d = '972' + d.slice(4);
  else if (d.startsWith('0')) d = '972' + d.slice(1);
  return d;
}

export function depositTimeText(rec) {
  const t = Date.parse(rec.save_time);
  if (Number.isNaN(t)) return '';
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(t));
}

export function buildMessage(rec) {
  return renderLockerMessage({
    time: depositTimeText(rec),
    order_number: rec.order_number,
    address: rec.device_address,
    box: rec.box_name,
    code: rec.pick_code,
  });
}

// --- WhatsApp (GreenAPI) -------------------------------------------------

export async function sendWhatsApp(phone, message) {
  const config = await readRuntimeConfig();
  const url = `${config.greenApiUrl}/waInstance${config.greenApiInstance}/sendMessage/${config.greenApiToken}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId: `${phone}@c.us`, message }),
  });
  if (!res.ok) throw new Error(`GreenAPI send failed (${res.status}): ${await res.text()}`);
  return res.json();
}
