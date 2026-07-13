// Single source of truth for the locker pickup WhatsApp message.
// Used BOTH by the app UI (pinned template in the notes carousel) and by the
// scheduled sender (netlify/functions/locker-whatsapp-notifier.mjs).
// Plain .js so the Netlify function can import it directly (no TS/JSX).
//
// Variables (filled automatically by the automation, shown as-is in the UI):
//   {time}          deposit date+time, Israel time
//   {order_number}  order number
//   {address}       locker address
//   {box}           box number
//   {code}          pickup code

export const LOCKER_MESSAGE_TEMPLATE = `היי! 👋 החבילה שלך הגיעה וממתינה לך בלוקר 📦
🕒 נכנסה בתאריך {time}

הזמנה מספר: {order_number}
📍 כתובת: {address}
🔢 תא מספר: {box}

🔑 קוד לפתיחת התא: {code}

מגיעים ללוקר, מקישים את הקוד — והתא נפתח. שיהיה בהצלחה! 😊`;

export function renderLockerMessage(vars = {}) {
  const filled = LOCKER_MESSAGE_TEMPLATE
    .replace(/\{order_number\}/g, vars.order_number ?? '')
    .replace(/\{address\}/g, vars.address ?? '')
    .replace(/\{box\}/g, vars.box ?? '')
    .replace(/\{code\}/g, vars.code ?? '')
    .replace(/\{time\}/g, vars.time ?? '');

  // Drop the "deposited at" line if no time was provided.
  return filled.replace(/^🕒 נכנסה בתאריך\s*$\r?\n?/m, '').trim();
}
