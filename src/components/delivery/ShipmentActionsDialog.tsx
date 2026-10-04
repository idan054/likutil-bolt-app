import { useEffect, useRef, useState } from 'react';
import { Loader2, PackagePlus, Trash2, X } from 'lucide-react';
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
  onAdditional: () => void;
  onCancelShipment: (shipment: DeliveryTaskResponse) => Promise<boolean>;
  onCheck: () => void;
  onClose: () => void;
}

export function ShipmentActionsDialog({ order, companyName, shipments, isChecking, isBusy,
  message, canRequestAdditional, onAdditional, onCancelShipment, onCheck, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelling = useRef(false);
  const [selectedNumber, setSelectedNumber] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState('');
  const active = shipments.filter(shipment => !shipment.cancelled);
  const selected = active.find(shipment => String(shipment.track_number) === selectedNumber) ?? active[0];
  const busy = isBusy || isChecking;

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
    className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40">
    <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="shipment-actions-title" className="text-xl font-bold">משלוחים ב{companyName}</h2>
          <p id="shipment-actions-description" className="mt-1 text-sm text-slate-500">הזמנה #{order.order_number || order.id} · בחרו את הפעולה הרצויה</p>
        </div>
        <button type="button" onClick={onClose} disabled={isBusy} aria-label="סגירת חלונית משלוחים"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"><X size={20} /></button>
      </div>
    </div>
    <div className="max-h-[70dvh] space-y-4 overflow-y-auto p-5 sm:p-6" aria-busy={busy}>
      {isChecking ? <p role="status" className="flex items-center gap-2 py-6"><Loader2 className="animate-spin" size={20} />בודק משלוחים ב{companyName}…</p> : <>
        {(error || message) && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error || message}</p>}
        {selected && <>
          {active.length > 1 ? <label className="block text-sm font-semibold">בחרו משלוח להדפסה או לביטול
            <select aria-label="בחירת משלוח" value={String(selected.track_number)} disabled={busy}
              onChange={event => { setSelectedNumber(event.target.value); setConfirmCancel(false); setError(''); }}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3">
              {active.map(shipment => <option key={shipment.track_number} value={String(shipment.track_number)}>משלוח #{shipment.track_number}</option>)}
            </select>
          </label> : <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm">משלוח קיים <strong dir="ltr">#{selected.track_number}</strong></p>}
          {confirmCancel ? <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <h3 className="font-bold">לבטל את משלוח #{selected.track_number} ב{companyName}?</h3>
            <p className="text-sm">הביטול חל רק על המשלוח שנבחר. לא יוזמן משלוח נוסף.</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => void cancel()} disabled={busy} className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{isBusy ? 'מבטל ומוודא…' : 'כן, בטל את המשלוח'}</button>
              <button onClick={() => setConfirmCancel(false)} disabled={busy} className="rounded-lg border border-red-200 bg-white px-4 py-2">חזרה</button>
            </div>
          </div> : <div className="space-y-3">
            <button onClick={onAdditional} disabled={busy || !canRequestAdditional}
              className="flex w-full items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-right text-blue-900 hover:bg-blue-100 disabled:opacity-50">
              <PackagePlus size={24} /><span><strong className="block">הזמנת משלוח נוסף ב{companyName}</strong><span className="mt-1 block text-sm">המשלוחים הקיימים יישארו פעילים. בהמשך תבחרו כמות חבילות.</span></span>
            </button>
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-2 font-semibold">הדפסה חוזרת של המדבקה</h3>
              {selected.status_checked === false ? <p className="text-sm text-amber-800">לא ניתן לאמת כרגע שהמשלוח עדיין פעיל. בדקו מצב משלוח.</p>
                : <ExistingShipments order={order} shipments={[selected]} />}
            </div>
            <button onClick={() => setConfirmCancel(true)} disabled={busy || !selected.can_cancel}
              className="flex w-full items-center gap-3 rounded-xl border border-red-200 p-4 text-right text-red-700 hover:bg-red-50 disabled:opacity-50">
              <Trash2 size={22} /><span><strong className="block">ביטול המשלוח שהוזמן</strong><span className="mt-1 block text-sm">{selected.can_cancel ? `משלוח #${selected.track_number} בלבד · יידרש אישור` : 'לא ניתן לבטל משלוח זה מתוך ליקוטיל כעת'}</span></span>
            </button>
          </div>}
        </>}
        {!selected && <p className="py-3">אין משלוחים פעילים ב{companyName}. אפשר לסגור ולהפיק משלוח חדש.</p>}
      </>}
      <button onClick={() => { setError(''); setConfirmCancel(false); onCheck(); }} disabled={busy} className="text-sm font-semibold text-blue-700 underline disabled:opacity-50">בדוק מצב משלוח</button>
    </div>
  </dialog>;
}
