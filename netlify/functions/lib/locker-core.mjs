// Shared core for the locker → WhatsApp automation.
// Imported by both the scheduled sender and the on/off control endpoint.
// (This file lives in a subfolder, so Netlify does NOT publish it as its own function.)
import { getStore } from '@netlify/blobs';
import { renderLockerMessage } from '../../../src/config/lockerMessageTemplate.js';

export const CONFIG = {
  // How far back a run looks (also tolerates a few missed 5-min runs).
  MAX_AGE_MINUTES: 20,
  SCHEDULE: '*/5 * * * *',

  // BetterLockers login.
  BETTERLOCKERS_USER: 'Spider972',
  BETTERLOCKERS_PASS: 'Biton654321',

  // GreenAPI (same instance used in src/components/order/notes/OrderNotes.tsx).
  GREENAPI_API_URL: 'https://7105.api.greenapi.com',
  GREENAPI_ID_INSTANCE: '7105474587',
  GREENAPI_API_TOKEN: '79edee4743dc4946a148eff95b599c0d3bd14f2876714a52b3',
};

const BL_BASE = 'https://admin.betterlockers.com/api/api';

// --- Persistent state (Netlify Blobs) -----------------------------------

export function stateStore() {
  return getStore('locker-notifier');
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

// --- BetterLockers API ---------------------------------------------------

export async function blLogin() {
  const res = await fetch(`${BL_BASE}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: CONFIG.BETTERLOCKERS_USER, password: CONFIG.BETTERLOCKERS_PASS }),
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
  const url = `${CONFIG.GREENAPI_API_URL}/waInstance${CONFIG.GREENAPI_ID_INSTANCE}/sendMessage/${CONFIG.GREENAPI_API_TOKEN}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId: `${phone}@c.us`, message }),
  });
  if (!res.ok) throw new Error(`GreenAPI send failed (${res.status}): ${await res.text()}`);
  return res.json();
}
