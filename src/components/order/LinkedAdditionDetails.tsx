import React, { useEffect, useRef, useState } from "react";
import { additionRequest } from "../../services/orders/additions.service";
import type { LinkedAddition, OrderDetails } from "../../types/order";

const messages: Record<string, string> = {
  awaiting_authorization: "ממתינים לאישור הכרטיס. עדיין אין לצרף את המוצרים.",
  awaiting_picker: "הכרטיס אושר, אך טרם חויב. ודאו שהחבילה המקורית והמוצרים כאן במחסן.",
  capturing: "החיוב בבדיקה. המתינו לאישור לפני צירוף המוצרים.",
  captured: "החיוב התקבל. משלימים את רישום התוספת — עדיין יש להמתין.",
  payment_unknown: "תוצאת התשלום עדיין לא ודאית. אין לצרף, למסור או לחייב שוב. פנו למשרד.",
  releasing: "הביטול בטיפול. אין לצרף את המוצרים.",
  release_unknown: "תוצאת שחרור המסגרת עדיין לא ודאית. אין לצרף; יש לפנות למשרד.",
  rejected: "התוספת בוטלה. אין לצרף את המוצרים ואין ליצור משלוח נפרד.",
  completed: "החיוב אושר והתוספת נרשמה. אפשר לצרף את המוצרים לחבילה המקורית.",
};
export const additionMessage = (state: string): string =>
  messages[state] ?? "לא התקבל מצב מאומת. אין לצרף את המוצרים; יש לפנות למשרד.";

export const LinkedAdditionDetails: React.FC<{ order: OrderDetails; onReset: () => void }> = ({ order, onReset }) => {
  const [data, setData] = useState<LinkedAddition | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const active = useRef(false);
  const controller = useRef<AbortController>();
  const run = async (decision?: "attach" | "reject") => {
    if (inFlight.current || !active.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    // Never retry POST on timeout. A fresh GET reconciles the persisted decision.
    controller.current = new AbortController();
    const timeout = window.setTimeout(() => controller.current?.abort(), 25000);
    try {
      const result = await additionRequest(order.id, decision, controller.current.signal);
      const expected = order.s3_addition;
      if (!expected || result.parent_id !== expected.parent_id ||
          result.amount_minor !== expected.amount_minor || result.currency !== expected.currency ||
          result.decimals !== expected.decimals) throw new Error("addition changed");
      if (active.current) setData(result);
    } catch {
      if (active.current) {
        setData(null);
        setError(decision ? "לא התקבלה תשובה ודאית. אין לצרף או ללחוץ שוב; רעננו את המצב." : "לא ניתן לאמת את מצב התוספת. אין לצרף; נסו לרענן.");
      }
    } finally {
      window.clearTimeout(timeout);
      inFlight.current = false;
      if (active.current) setBusy(false);
    }
  };
  useEffect(() => {
    active.current = true;
    void run();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void run();
    }, 15000);
    return () => { active.current = false; controller.current?.abort(); window.clearInterval(interval); };
  }, [order.id]);
  const parent = order.s3_addition!;
  return <section dir="rtl" className="rounded-xl border-2 border-amber-400 bg-white p-5 space-y-5" aria-busy={busy}>
    <button type="button" onClick={onReset} className="text-blue-700 underline">חזרה להזמנות</button>
    <header className="space-y-2">
      <p className="font-bold text-amber-900">תוספת בלבד · אין לשלוח בנפרד</p>
      <h1 className="text-2xl font-bold">לצרף להזמנה #{parent.parent_number}</h1>
      <p>בקשת תוספת #{order.order_number ?? order.id} · {order.billing.first_name} {order.billing.last_name}</p>
      <p className="text-lg font-semibold">סכום לחיוב באישור הצירוף: <bdi>{(parent.amount_minor / 10 ** parent.decimals).toFixed(parent.decimals)} {parent.currency}</bdi></p>
      <a href={`?order=${parent.parent_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">פתיחת ההזמנה המקורית</a>
    </header>
    <ul className="divide-y border rounded-lg">
      {order.line_items.map(item => <li key={item.id} className="p-4 flex justify-between gap-4">
        <span>{item.name}{item.sku && <small className="block text-gray-600">מק״ט {item.sku}</small>}</span>
        <strong className="whitespace-nowrap">{item.quantity} יח׳</strong>
      </li>)}
    </ul>
    <div role="status" aria-live="polite" className="rounded-lg bg-slate-100 p-4 font-medium">
      {error || (data ? additionMessage(data.state) : "בודקים את מצב התוספת…")}
    </div>
    {data?.can_decide && <>
      <p className="font-semibold">לחצו ״אפשר לצרף״ רק כשהחבילה טרם נמסרה לשליח וכל מוצרי התוספת זמינים בידיכם. הלחיצה תפעיל חיוב.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <button type="button" disabled={busy} onClick={() => void run("attach")} className="min-h-24 rounded-xl bg-green-700 p-5 text-xl font-bold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-green-800">אפשר לצרף</button>
        <button type="button" disabled={busy} onClick={() => void run("reject")} className="min-h-24 rounded-xl border-2 border-red-700 p-5 text-xl font-bold text-red-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-red-800">אי אפשר לצרף</button>
      </div>
      <p className="text-sm text-gray-600">״אי אפשר לצרף״ מבטל רק את התוספת ומבקש שחרור מסגרת. ההזמנה המקורית ממשיכה כרגיל.</p>
    </>}
    <button type="button" disabled={busy} onClick={() => void run()} className="rounded-lg border px-4 py-3 disabled:opacity-50">{busy ? "בודקים…" : "רענון מצב התוספת"}</button>
  </section>;
};
