import React, { useState } from "react";
import { X, Settings2 } from "lucide-react";
import { useFastDeliveryRules } from "../../hooks/useFastDeliveryRules";
import { normalizeLine } from "../../utils/storeKey";

const linesToArray = (text: string) =>
  text
    .split("\n")
    .map(normalizeLine)
    .filter(Boolean);

const arrayToLines = (arr: string[]) => (arr || []).join("\n");

const idsToLines = (ids: number[]) => (ids || []).join("\n");

const parsePositiveIds = (text: string) => {
  const lines = linesToArray(text);
  const values = lines.map(Number);
  const invalid = lines.filter((_, index) => {
    const value = values[index];
    return !Number.isInteger(value) || value <= 0;
  });

  return {
    invalid,
    values: Array.from(new Set(values.filter((value) => Number.isInteger(value) && value > 0))),
  };
};

export const FastDeliveryRulesWidget: React.FC = () => {
  const { rules, isLoading, save } = useFastDeliveryRules();
  const [open, setOpen] = useState(false);

  const [citiesText, setCitiesText] = useState("");
  const [blockedText, setBlockedText] = useState("");
  const [blockedProductIdsText, setBlockedProductIdsText] = useState("");
  const [blockedCategoryIdsText, setBlockedCategoryIdsText] = useState("");
  const [blockedPriceThresholdText, setBlockedPriceThresholdText] = useState("2000");
  const [vipRolesText, setVipRolesText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!rules) return;
    setCitiesText(arrayToLines(rules.cities));
    setBlockedText(arrayToLines(rules.blockedKeywords));
    setBlockedProductIdsText(idsToLines(rules.blockedProductIds));
    setBlockedCategoryIdsText(idsToLines(rules.blockedCategoryIds));
    setBlockedPriceThresholdText(String(rules.blockedPriceThreshold));
    setVipRolesText(arrayToLines(rules.vipRoles));
  }, [rules]);

  const onSave = async () => {
    const productIds = parsePositiveIds(blockedProductIdsText);
    const categoryIds = parsePositiveIds(blockedCategoryIdsText);
    const priceThreshold = Number(blockedPriceThresholdText);

    if (productIds.invalid.length || categoryIds.invalid.length) {
      setValidationError("מזהי מוצר וקטגוריה חייבים להיות מספרים חיוביים, אחד בכל שורה");
      return;
    }

    if (!Number.isFinite(priceThreshold) || priceThreshold < 0) {
      setValidationError("סף המחיר חייב להיות מספר חיובי או אפס");
      return;
    }

    setValidationError(null);
    await save({
      cities: linesToArray(citiesText),
      blockedKeywords: linesToArray(blockedText),
      blockedProductIds: productIds.values,
      blockedCategoryIds: categoryIds.values,
      blockedPriceThreshold: priceThreshold,
      vipRoles: linesToArray(vipRolesText),
    });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-2 shadow-lg hover:bg-slate-800"
        title="כללי מהיר לי"
      >
        <Settings2 size={16} />
        <span className="text-sm">כללי מהיר לי</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3">
          <div className="w-full max-w-2xl max-h-[calc(100vh-1.5rem)] rounded-xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold">כללי מהיר לי</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded hover:bg-slate-100"
                aria-label="סגור"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="max-h-[calc(100vh-5rem)] overflow-y-auto p-4 space-y-4"
              dir="rtl"
            >
              <div>
                <div className="text-sm font-medium mb-1">ישובים זכאים (עיר בשורה)</div>
                <textarea
                  value={citiesText}
                  onChange={(e) => setCitiesText(e.target.value)}
                  className="w-full min-h-[120px] rounded-lg border p-2 text-sm"
                  placeholder={"לדוגמה:\nתל אביב\nרמת גן\nגבעתיים"}
                />
              </div>

              <div>
                <div className="text-sm font-medium mb-1">מילות זיהוי למוצר חסום</div>
                <div className="text-xs text-slate-500 mb-2">
                  משמשות יחד עם סף המחיר כאשר לא הוגדרו קטגוריות חסומות, או כשנתוני הקטגוריה אינם זמינים.
                </div>
                <textarea
                  value={blockedText}
                  onChange={(e) => setBlockedText(e.target.value)}
                  className="w-full min-h-[120px] rounded-lg border p-2 text-sm"
                  placeholder={"לדוגמה:\nמדפסת\nPrinter"}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-medium mb-1">מזהי קטגוריות חסומות</div>
                  <textarea
                    value={blockedCategoryIdsText}
                    onChange={(e) => setBlockedCategoryIdsText(e.target.value)}
                    className="w-full min-h-[90px] rounded-lg border p-2 text-sm"
                    placeholder={"לדוגמה:\n123\n456"}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">מזהי מוצרים חסומים</div>
                  <textarea
                    value={blockedProductIdsText}
                    onChange={(e) => setBlockedProductIdsText(e.target.value)}
                    className="w-full min-h-[90px] rounded-lg border p-2 text-sm"
                    placeholder={"מוצר אחד בכל שורה"}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block" htmlFor="blocked-price-threshold">
                  סף מחיר לזיהוי חלופי כשאין נתוני קטגוריה (במטבע החנות)
                </label>
                <input
                  id="blocked-price-threshold"
                  type="number"
                  min="0"
                  step="1"
                  value={blockedPriceThresholdText}
                  onChange={(e) => setBlockedPriceThresholdText(e.target.value)}
                  className="w-full rounded-lg border p-2 text-sm"
                />
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Roles של VIP (role בשורה)</div>
                <textarea
                  value={vipRolesText}
                  onChange={(e) => setVipRolesText(e.target.value)}
                  className="w-full min-h-[80px] rounded-lg border p-2 text-sm"
                  placeholder={"לדוגמה:\nwholesale_customer\nprimum"}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                {validationError && (
                  <div className="ml-auto self-center text-xs text-red-700">
                    {validationError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg border"
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-60"
                >
                  שמור
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
