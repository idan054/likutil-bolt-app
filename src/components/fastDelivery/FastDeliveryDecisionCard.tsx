import React, { useMemo, useState } from "react";
import { Pencil, AlertTriangle, RefreshCcw } from "lucide-react";
import type { DeliveryType } from "../../types/fastDelivery";
import type { OrderDetails } from "../../types/order";
import { useOrderFastDeliveryDecision } from "../../hooks/useOrderFastDeliveryDecision";

const badgeClasses = (type: "fast" | "regular" | "needs_review") => {
  switch (type) {
    case "fast":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "needs_review":
      return "bg-amber-50 text-amber-800 border-amber-200";
    default:
      return "bg-slate-50 text-slate-800 border-slate-200";
  }
};

export const FastDeliveryDecisionCard: React.FC<{ order: OrderDetails }> = ({ order }) => {
  const { decision, isLoading, autoDecideIfNeeded, manualOverride, retryWooSync } =
    useOrderFastDeliveryDecision(order);

  const [pickerOpen, setPickerOpen] = useState(false);

  React.useEffect(() => {
    // Auto decide on first open
    autoDecideIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  const label = useMemo(() => {
    if (!decision) return "לא נקבע";
    if (decision.decisionState === "needs_review") return "דורש בדיקה";
    return decision.deliveryType === "fast" ? "מהיר לי" : "רגיל";
  }, [decision]);

  const badgeType = useMemo(() => {
    if (!decision) return "needs_review" as const;
    if (decision.decisionState === "needs_review") return "needs_review" as const;
    return decision.deliveryType === "fast" ? "fast" : "regular";
  }, [decision]);

  return (
    <div className="bg-white rounded-lg border p-4 mb-4" dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500 mb-1">שיוך מהיר לי</div>
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${badgeClasses(
                badgeType
              )}`}
              title={(decision?.checks || [])
                .map((c) => `${c.ok ? "✔" : "✖"} ${c.label}`)
                .join("\n")}
            >
              <span>{label}</span>
              {decision?.decisionState === "manual" && (
                <span className="text-xs opacity-70">(ידני)</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="p-2 rounded hover:bg-slate-100"
              title="שינוי"
              aria-label="שינוי"
            >
              <Pencil size={16} />
            </button>
          </div>

          {decision?.decisionState === "needs_review" && (
            <div className="text-xs text-amber-700 mt-2">חסר מידע מלא, נדרש לוודא ידנית</div>
          )}
        </div>

        {decision?.wooSyncError && (
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle size={18} />
            <div className="text-xs">
              עדכון הערה ל־WooCommerce נכשל
              <div>
                <button
                  type="button"
                  onClick={retryWooSync}
                  className="inline-flex items-center gap-1 mt-1 text-xs underline"
                >
                  <RefreshCcw size={14} />
                  נסה שוב
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {pickerOpen && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPickerOpen(false);
              manualOverride("fast");
            }}
            className="px-3 py-2 rounded-lg border hover:bg-slate-50"
            disabled={isLoading}
          >
            מהיר לי
          </button>
          <button
            type="button"
            onClick={() => {
              setPickerOpen(false);
              manualOverride("regular");
            }}
            className="px-3 py-2 rounded-lg border hover:bg-slate-50"
            disabled={isLoading}
          >
            רגיל
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(false)}
            className="px-3 py-2 rounded-lg border hover:bg-slate-50"
          >
            סגור
          </button>
        </div>
      )}
    </div>
  );
};
