import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import type { OrderDetails, OrderSummary } from "../types/order";
import type { OrderDeliveryDecision, DeliveryType, DeliveryDecisionState } from "../types/fastDelivery";
import { useSettings } from "./useSettings";
import { useFastDeliveryRules } from "./useFastDeliveryRules";
import { getOrderDeliveryDecision, upsertOrderDeliveryDecision } from "../services/fastDelivery/decision.service";
import { decideFastDelivery } from "../services/fastDelivery/decide";
import { getCustomerById } from "../services/customers/customers.service";
import { createOrderNote } from "../services/orders/notes.service";

const decisionCache = new Map<string, OrderDeliveryDecision | null>();

export const useOrderFastDeliveryDecision = (order: OrderDetails | OrderSummary) => {
  const { settings } = useSettings();
  const { rules } = useFastDeliveryRules();

  const [decision, setDecision] = useState<OrderDeliveryDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cacheKey = useMemo(() => {
    const storeUrl = settings?.storeUrl ?? "";
    return storeUrl && order?.id ? `${storeUrl}__${order.id}` : "";
  }, [settings?.storeUrl, (order as any)?.id]);

  const load = useCallback(async () => {
    if (!settings?.storeUrl || !order?.id) return;
    if (decisionCache.has(cacheKey)) {
      setDecision(decisionCache.get(cacheKey) ?? null);
      return;
    }
    setIsLoading(true);
    try {
      const d = await getOrderDeliveryDecision(settings.storeUrl, Number(order.id));
      decisionCache.set(cacheKey, d);
      setDecision(d);
    } catch (e) {
      console.error('[FastDelivery] Failed to load decision:', e);
      // Don't show toast - this is expected for new orders
    } finally {
      setIsLoading(false);
    }
  }, [settings?.storeUrl, order?.id, cacheKey]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(
    async (next: Omit<OrderDeliveryDecision, "storeKey" | "updatedAt">) => {
      if (!settings?.storeUrl) return null;
      const saved = await upsertOrderDeliveryDecision(settings.storeUrl, next);
      decisionCache.set(cacheKey, saved);
      setDecision(saved);
      return saved;
    },
    [settings?.storeUrl, cacheKey]
  );

  const trySyncWooNote = useCallback(
    async (note: string) => {
      // best-effort
      if (!settings?.storeUrl || !("billing" in order)) return { ok: true as const };
      try {
        await createOrderNote(String(order.id), { note, customer_note: false }, order as OrderDetails);
        return { ok: true as const };
      } catch (e) {
        return { ok: false as const };
      }
    },
    [settings?.storeUrl, order]
  );

  const autoDecideIfNeeded = useCallback(async () => {
    if (!settings?.storeUrl || !rules) return;

    // Only for full order details screen (needs shipping + items). If it's summary, skip.
    if (!("shipping" in order)) return;

    const existing = await getOrderDeliveryDecision(settings.storeUrl, Number(order.id));
    if (existing) {
      decisionCache.set(cacheKey, existing);
      setDecision(existing);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch customer role (VIP) if possible
      let role: string | null = null;
      if ((order as OrderDetails).customer_id) {
        try {
          const customer = await getCustomerById(String((order as OrderDetails).customer_id));
          role = customer?.role ?? null;
        } catch {
          role = null;
        }
      }

      const city = (order as OrderDetails).shipping?.city || (order as OrderDetails).billing?.city || "";
      const lineItemNames = (order as OrderDetails).line_items?.map((li) => li.name).filter(Boolean) ?? [];

      const res = decideFastDelivery({
        customerRole: role,
        city,
        lineItemNames,
        rules,
      });

      const now = new Date().toISOString();
      const toSave: Omit<OrderDeliveryDecision, "storeKey" | "updatedAt"> = {
        orderId: Number(order.id),
        deliveryType: res.deliveryType,
        decisionState: res.decisionState,
        override: false,
        checks: res.checks,
        wooSyncError: false,
        wooLastSyncAt: undefined,
      };

      const saved = await persist(toSave);

      // Woo note always (per your choice)
      const noteText =
        res.decisionState === "needs_review"
          ? "סוג משלוח במערכת ליקוט: דורש בדיקה (חסר מידע מלא)"
          : `סוג משלוח במערכת ליקוט: ${res.deliveryType === "fast" ? "מהיר לי" : "רגיל"} (אוטומטי)`;

      const sync = await trySyncWooNote(noteText);

      if (!sync.ok && saved) {
        await persist({
          ...toSave,
          wooSyncError: true,
          wooLastSyncAt: now,
        });
      } else if (saved) {
        await persist({
          ...toSave,
          wooSyncError: false,
          wooLastSyncAt: now,
        });
      }
    } catch (e) {
      console.error('[FastDelivery] autoDecideIfNeeded error:', e);
      // Only log to console, don't bother user with toast for background auto-decision
    } finally {
      setIsLoading(false);
    }
  }, [settings?.storeUrl, rules, order, persist, trySyncWooNote, cacheKey]);

  const manualOverride = useCallback(
    async (type: DeliveryType) => {
      if (!settings?.storeUrl || !rules) return;

      // Need order details for note
      if (!("shipping" in order)) return;

      setIsLoading(true);
      try {
        const now = new Date().toISOString();
        const next: Omit<OrderDeliveryDecision, "storeKey" | "updatedAt"> = {
          orderId: Number(order.id),
          deliveryType: type,
          decisionState: "manual",
          override: true,
          checks: decision?.checks ?? [],
          wooSyncError: false,
          wooLastSyncAt: undefined,
        };

        const saved = await persist(next);

        const noteText = `סוג משלוח במערכת ליקוט: ${type === "fast" ? "מהיר לי" : "רגיל"} (שונה ידנית)`;
        const sync = await trySyncWooNote(noteText);

        if (!sync.ok && saved) {
          await persist({
            ...next,
            wooSyncError: true,
            wooLastSyncAt: now,
          });
        } else if (saved) {
          await persist({
            ...next,
            wooSyncError: false,
            wooLastSyncAt: now,
          });
        }
      } catch {
        toast.error("שינוי סוג משלוח נכשל");
      } finally {
        setIsLoading(false);
      }
    },
    [settings?.storeUrl, rules, order, decision?.checks, persist, trySyncWooNote]
  );

  const retryWooSync = useCallback(async () => {
    if (!settings?.storeUrl || !decision) return;

    if (!("shipping" in order)) return;

    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const noteText =
        decision.decisionState === "manual"
          ? `סוג משלוח במערכת ליקוט: ${decision.deliveryType === "fast" ? "מהיר לי" : "רגיל"} (שונה ידנית)`
          : decision.decisionState === "needs_review"
            ? "סוג משלוח במערכת ליקוט: דורש בדיקה (חסר מידע מלא)"
            : `סוג משלוח במערכת ליקוט: ${decision.deliveryType === "fast" ? "מהיר לי" : "רגיל"} (אוטומטי)`;

      const sync = await trySyncWooNote(noteText);

      await persist({
        ...decision,
        wooSyncError: !sync.ok,
        wooLastSyncAt: now,
      });
    } finally {
      setIsLoading(false);
    }
  }, [settings?.storeUrl, decision, order, persist, trySyncWooNote]);

  return {
    decision,
    isLoading,
    loadDecision: load,
    autoDecideIfNeeded,
    manualOverride,
    retryWooSync,
  };
};
