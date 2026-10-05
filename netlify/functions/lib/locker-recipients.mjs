import { normalizePhone } from './locker-core.mjs';
import { readLockerOrder } from './locker-order-notes.mjs';

// Compare digits after normalizing international/local formatting.
export function isOneDigitApart(a, b) {
  if (a.length === b.length) return [...a].filter((digit, i) => digit !== b[i]).length === 1;
  if (Math.abs(a.length - b.length) !== 1) return false;
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  let i = 0;
  while (i < shorter.length && shorter[i] === longer[i]) i++;
  return shorter.slice(i) === longer.slice(i + 1);
}

export function lockerRecipients(rec, order) {
  const orderPhone = normalizePhone(order.billing?.phone || order.shipping?.phone);
  const lockerPhone = normalizePhone(rec.get_user_mobile);
  // E.164 permits at most 15 digits; never submit an empty or obviously broken destination.
  const usable = phone => /^[1-9]\d{7,14}$/.test(phone);
  if (!usable(orderPhone)) throw new Error('מספר הטלפון בהזמנה חסר או אינו תקין');
  const same = lockerPhone === orderPhone;
  const typo = !same && isOneDigitApart(lockerPhone, orderPhone);
  const recipients = [orderPhone];
  if (!same && !typo && usable(lockerPhone)) recipients.push(lockerPhone);
  return { orderId: order.id, orderPhone, lockerPhone, recipients,
    phoneDecision: same ? 'same' : typo ? 'corrected' : recipients.length === 2 ? 'both' : 'order-only' };
}

export async function resolveLockerRecipients(rec) {
  const { order } = await readLockerOrder(rec.order_number);
  return lockerRecipients(rec, order);
}
