import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Building2, Check, Loader2, Printer } from "lucide-react";
import type { OrderDetails } from "../../types/order";
import type { useCompanyPrintDocuments } from "../../hooks/useCompanyPrintDocuments";

type PrintState = ReturnType<typeof useCompanyPrintDocuments>;

interface CompanyPrintDocumentsProps {
  order: OrderDetails;
  print: PrintState;
}

const PrintActions = ({ print }: { print: PrintState }) => (
  <div className="grid gap-2.5">
    {print.actions.map((action) =>
      action.valid ? (
        <a
          key={action.id}
          href={action.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => print.onPrint(action)}
          className="flex min-h-12 items-center justify-between gap-3 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-right text-sm font-bold text-slate-900 transition hover:border-blue-500 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:text-base"
        >
          <span>{action.label}</span>
          {print.openedIds.has(action.id) ? (
            <Check aria-label="הקישור נפתח" className="shrink-0 text-emerald-700" size={20} />
          ) : (
            <Printer aria-hidden="true" className="shrink-0 text-slate-600" size={20} />
          )}
        </a>
      ) : (
        <div
          key={action.id}
          className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {action.label} — הקישור אינו זמין. פנו למשרד.
        </div>
      )
    )}
  </div>
);

const PrintProgress = ({ print }: { print: PrintState }) =>
  print.awaitingDeliveryNote || print.isRefreshing || print.refreshError ? (
    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950" aria-live="polite">
      {print.awaitingDeliveryNote && (
        <p className="flex items-center gap-2 font-bold">
          <Loader2 aria-hidden="true" size={17} className="animate-spin" />
          מפיק תעודת משלוח…
        </p>
      )}
      {print.awaitingDeliveryNote && (
        <p className="mt-1">ההפקה עשויה להימשך עד 90 שניות. חזרו אחרי פתיחת ה־PDF.</p>
      )}
      {print.refreshError && <p className="mt-1 font-semibold text-red-800">{print.refreshError}</p>}
      <button
        type="button"
        onClick={() => void print.refreshDocuments()}
        disabled={print.isRefreshing}
        className="mt-2 font-bold text-blue-800 underline underline-offset-2 disabled:opacity-50"
      >
        {print.isRefreshing ? "מעדכן פרטי מסמכים…" : "בדוק שוב את פרטי התעודה"}
      </button>
    </div>
  ) : null;

export const CompanyPrintDocuments = ({ order, print }: CompanyPrintDocumentsProps) => {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!print.isBlocked) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const containFocus = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        )
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", containFocus, true);
    return () => {
      document.removeEventListener("keydown", containFocus, true);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [print.isBlocked]);

  if (!print.documents) return null;

  const contents = (
    <section
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-print-title"
      aria-describedby="company-print-order"
      tabIndex={-1}
      dir="rtl"
      className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border-t-[6px] border-t-red-600 bg-white p-5 text-slate-950 shadow-2xl outline-none sm:p-7"
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl bg-red-50 p-2.5 text-red-700">
          <Building2 aria-hidden="true" size={25} />
        </div>
        <div className="min-w-0">
          <h2 id="company-print-title" className="text-xl font-extrabold leading-snug sm:text-2xl">
            {print.documents.popup?.title || "מסמכי החברה אינם זמינים"}
          </h2>
          <p id="company-print-order" className="mt-1 text-sm text-slate-600">
            הזמנה #{order.order_number ?? order.id}
            {print.documents.company ? ` · ${print.documents.company}` : ""}
          </p>
        </div>
      </div>

      {Array.isArray(print.documents.popup?.lines) && (
        <ul className="mb-5 space-y-1 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800 sm:text-base">
          {print.documents.popup.lines.map((line, index) => <li key={index}>{line}</li>)}
        </ul>
      )}

      <PrintActions print={print} />
      <PrintProgress print={print} />
      <button
        type="button"
        onClick={print.confirm}
        disabled={!print.canConfirm}
        className="mt-5 w-full rounded-xl bg-red-600 px-4 py-3.5 text-base font-extrabold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
      >
        הדפסתי וצירפתי לחבילה — המשך
      </button>
      <p className="mt-2 text-center text-xs text-slate-600">
        המשך יתאפשר לאחר פתיחת כל קישורי ההדפסה ואישור שהמסמכים צורפו.
      </p>
    </section>
  );

  return (
    <>
      {!print.isBlocked && (
        <section dir="rtl" className="mb-5 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <h3 className="mb-3 font-extrabold text-amber-950">🏢 הזמנת חברה — מסמכים להדפסה</h3>
          <PrintActions print={print} />
          <PrintProgress print={print} />
        </section>
      )}
      {print.isBlocked && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4" role="presentation">
          {contents}
        </div>,
        document.body
      )}
    </>
  );
};
