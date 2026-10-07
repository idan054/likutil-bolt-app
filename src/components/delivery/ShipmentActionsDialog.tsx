import { useEffect, useRef, useState } from 'react';
import { Loader2, PackagePlus, RefreshCw, Trash2, X } from 'lucide-react';
import type { OrderDetails } from '../../types/order';
import type { DeliveryTaskResponse } from '../../services/delivery/types';
import { ExistingShipments } from './ExistingShipments';

interface Props {
  order: OrderDetails;
  companyName: string;
  shipments: DeliveryTaskResponse[];
  isChecking: boolean;
  isBusy: boolean;
  message: string;
  canRequestAdditional: boolean;
  resultUnknown?: boolean;
  onAdditional: () => void;
  onCancelShipment: (shipment: DeliveryTaskResponse) => Promise<boolean>;
  onCheck: () => void;
  onClose: () => void;
}

export function ShipmentActionsDialog({ order, companyName, shipments, isChecking, isBusy,
  message, canRequestAdditional, resultUnknown, onAdditional, onCancelShipment, onCheck, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelling = useRef(false);
  const [selectedNumber, setSelectedNumber] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState('');
  const [confirmAdditional, setConfirmAdditional] = useState(false);
  const active = shipments.filter(shipment => !shipment.cancelled);
  const selected = active.find(shipment => String(shipment.track_number) === selectedNumber) ?? active[0];
  const busy = isBusy || isChecking;
  const cancelHint = selected?.can_cancel ? 'מבטל רק את המשלוח שנבחר. יידרש אישור.'
    : selected?.delivered ? 'המשלוח כבר נמסר ולכן אי אפשר לבטל אותו.' : 'הביטול אינו זמין כרגע בחברת המשלוחים.';

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); previousFocus?.focus(); };
  }, []);

  const cancel = async () => {
    if (!selected || busy || cancelling.current) return;
    cancelling.current = true;
    setError('');
    try {
      if (await onCancelShipment(selected)) onClose();
      else { setConfirmCancel(false); setError('הביטול לא אושר. בדקו את מצב המשלוח לפני ניסיון נוסף.'); }
    } finally { cancelling.current = false; }
  };

  return <dialog ref={dialog} aria-labelledby="shipment-actions-title" aria-describedby="shipment-actions-description"
    dir="rtl" onCancel={event => { event.preventDefault(); if (!isBusy) onClose(); }}
    className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40">
    <div className="px-5 pt-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="shipment-actions-title" className="text-lg font-bold">{companyName}</h2>
          <p id="shipment-actions-description" className="mt-1 text-sm text-slate-500">הזמנה #{order.order_number || order.id}</p>
        </div>
        <button type="button" onClick={onClose} disabled={isBusy} aria-label="סגירת חלונית משלוחים"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"><X size={20} /></button>
      </div>
    </div>
    <div className="max-h-[70dvh] space-y-3 overflow-y-auto p-5" aria-busy={busy}>
      {isChecking ? <p role="status" className="flex items-center gap-2 py-4"><Loader2 className="animate-spin" size={18} />בודק…</p> : <>
        {(error || message) && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error || message}</p>}
        {confirmAdditional ? <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-bold">להפיק משלוח חדש?</h3>
          <p className="text-sm">ייתכן שהניסיון הקודם הצליח. הפקה חדשה תיצור משלוח נוסף ולא תבטל משלוח קיים. בדקו קודם בחברת המשלוחים כדי להימנע מכפילות.</p>
          <button onClick={onAdditional} disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">המשך להפקת משלוח חדש</button>
          <button onClick={() => setConfirmAdditional(false)} disabled={busy} className="mr-2 rounded-lg border bg-white px-4 py-2">חזרה</button>
        </div> : <>
        {selected && <>
          {!message && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{selected.delivered ? 'המשלוח כבר נמסר. אפשר להדפיס את המדבקה הקיימת או ליצור משלוח נוסף לחבילה נוספת.' : 'יש כבר מדבקה מוכנה למשלוח. אפשר להדפיס אותה או ליצור משלוח נוסף לחבילה נוספת.'}</p>}
          {active.length > 1 ? <label className="block text-sm font-semibold">משלוח
            <select aria-label="בחירת משלוח" value={String(selected.track_number)} disabled={busy}
              onChange={event => { setSelectedNumber(event.target.value); setConfirmCancel(false); setError(''); }}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3">
              {active.map(shipment => <option key={shipment.track_number} value={String(shipment.track_number)}>משלוח #{shipment.track_number}</option>)}
            </select>
          </label> : <p className="text-sm text-slate-500">משלוח <span dir="ltr">#{selected.track_number}</span></p>}
          {confirmCancel ? <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <h3 className="font-bold">לבטל משלוח #{selected.track_number}?</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => void cancel()} disabled={busy} title="ביטול המשלוח שנבחר בלבד, ללא יצירת משלוח חדש" className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{isBusy ? 'מבטל ומוודא…' : 'כן, בטל'}</button>
              <button onClick={() => setConfirmCancel(false)} disabled={busy} className="rounded-lg border border-red-200 bg-white px-4 py-2">חזרה</button>
            </div>
          </div> : <div className="space-y-2">
            <ExistingShipments order={order} shipments={[selected]} />
            <div className="group relative">
              <button onClick={() => resultUnknown ? setConfirmAdditional(true) : onAdditional()} disabled={busy || !canRequestAdditional} aria-describedby="additional-shipment-hint"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 font-medium hover:bg-slate-50 disabled:opacity-50">
                <PackagePlus size={18} aria-hidden="true" /><span>משלוח נוסף</span>
              </button>
              <span id="additional-shipment-hint" role="tooltip" className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 hidden w-full rounded-lg bg-slate-800 p-2 text-center text-xs text-white group-hover:block group-focus-within:block">משלוח נוסף ב{companyName}. המשלוחים הקיימים לא יבוטלו.</span>
            </div>
            <div className="group relative" tabIndex={!selected.can_cancel ? 0 : undefined} aria-describedby="cancel-shipment-hint">
              <button onClick={() => setConfirmCancel(true)} disabled={busy || !selected.can_cancel} aria-describedby="cancel-shipment-hint"
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-red-700 hover:bg-red-50 disabled:text-slate-400">
                <Trash2 size={18} aria-hidden="true" /><span>בטל משלוח</span>
              </button>
              <span id="cancel-shipment-hint" role="tooltip" className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 hidden w-full rounded-lg bg-slate-800 p-2 text-center text-xs text-white group-hover:block group-focus-within:block">{cancelHint}</span>
            </div>
          </div>}
        </>}
        {!selected && <>
          {!message && <p className="py-3">לא נמצאה מדבקה למשלוח בחברה זו.</p>}
          {canRequestAdditional && <button onClick={() => resultUnknown ? setConfirmAdditional(true) : onAdditional()} disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50">
            <PackagePlus size={18} aria-hidden="true" /><span>{resultUnknown ? 'הפק משלוח חדש' : 'צור משלוח נוסף לחבילה נוספת'}</span>
          </button>}
        </>}
        </>}
      </>}
      <button onClick={() => { setError(''); setConfirmCancel(false); setConfirmAdditional(false); onCheck(); }} disabled={busy} title="בדוק מצב עדכני בחברת המשלוחים" className="mx-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-50"><RefreshCw size={13} aria-hidden="true" /><span>בדוק מצב משלוח</span></button>
    </div>
  </dialog>;
}
