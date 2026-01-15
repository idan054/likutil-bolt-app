import React, { useMemo, useState } from "react";
import { X, Settings2 } from "lucide-react";
import { useFastDeliveryRules } from "../../hooks/useFastDeliveryRules";
import { normalizeLine } from "../../utils/storeKey";

const linesToArray = (text: string) =>
  text
    .split("\n")
    .map(normalizeLine)
    .filter(Boolean);

const arrayToLines = (arr: string[]) => (arr || []).join("\n");

export const FastDeliveryRulesWidget: React.FC = () => {
  const { rules, isLoading, save } = useFastDeliveryRules();
  const [open, setOpen] = useState(false);

  const [citiesText, setCitiesText] = useState("");
  const [blockedText, setBlockedText] = useState("");
  const [vipRolesText, setVipRolesText] = useState("");

  const canOpen = !!rules;

  React.useEffect(() => {
    if (!rules) return;
    setCitiesText(arrayToLines(rules.cities));
    setBlockedText(arrayToLines(rules.blockedKeywords));
    setVipRolesText(arrayToLines(rules.vipRoles));
  }, [rules]);

  const onSave = async () => {
    await save({
      cities: linesToArray(citiesText),
      blockedKeywords: linesToArray(blockedText),
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
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl overflow-hidden">
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

            <div className="p-4 space-y-4" dir="rtl">
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
                <div className="text-sm font-medium mb-1">מילות חסימה בשם מוצר (מילה בשורה)</div>
                <textarea
                  value={blockedText}
                  onChange={(e) => setBlockedText(e.target.value)}
                  className="w-full min-h-[120px] rounded-lg border p-2 text-sm"
                  placeholder={"לדוגמה:\nמדפסת\nPrinter"}
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
