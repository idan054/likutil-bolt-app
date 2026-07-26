import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import type { OrderDetails, OrderSummary } from "../types/order";
import type { OrderDeliveryDecision, DeliveryType } from "../types/fastDelivery";
import { useSettings } from "./useSettings";
import { useFastDeliveryRules } from "./useFastDeliveryRules";
import { getOrderDeliveryDecision, upsertOrderDeliveryDecision } from "../services/fastDelivery/decision.service";
import {
  decideFastDelivery,
  type DecideFastDeliveryResult,
} from "../services/fastDelivery/decide";
import { getCustomerById } from "../services/customers/customers.service";
import { createOrderNote } from "../services/orders/notes.service";
import { hasSelectedFastShipping } from "../utils/shippingMethod";

const decisionCache = new Map<string, OrderDeliveryDecision | null>();
const decisionListeners = new Map<
  string,
  Set<(decision: OrderDeliveryDecision | null) => void>
>();
const decisionCacheRevisions = new Map<string, number>();

const publishDecision = (
  cacheKey: string,
  decision: OrderDeliveryDecision | null
) => {
  decisionCache.set(cacheKey, decision);
  decisionCacheRevisions.set(
    cacheKey,
    (decisionCacheRevisions.get(cacheKey) ?? 0) + 1
  );
  decisionListeners.get(cacheKey)?.forEach((listener) => listener(decision));
};

export const useOrderFastDeliveryDecision = (order: OrderDetails | OrderSummary) => {
  const { settings } = useSettings();
  const { rules } = useFastDeliveryRules();

  const [decision, setDecision] = useState<OrderDeliveryDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const orderId = order?.id;
  const cacheKey = useMemo(() => {
    const storeUrl = settings?.storeUrl ?? "";
    return storeUrl && orderId ? `${storeUrl}__${orderId}` : "";
  }, [settings?.storeUrl, orderId]);

  useEffect(() => {
    if (!cacheKey) return;

    const listener = (next: OrderDeliveryDecision | null) => {
      setDecision(next);
    };
    const listeners = decisionListeners.get(cacheKey) ?? new Set();
    listeners.add(listener);
    decisionListeners.set(cacheKey, listeners);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        decisionListeners.delete(cacheKey);
      }
    };
  }, [cacheKey]);

  const load = useCallback(async () => {
    if (!settings?.storeUrl || !order?.id) return;
    if (decisionCache.has(cacheKey)) {
      setDecision(decisionCache.get(cacheKey) ?? null);
      return;
    }
    const revisionBeforeLoad = decisionCacheRevisions.get(cacheKey) ?? 0;
    setIsLoading(true);
    try {
      const d = await getOrderDeliveryDecision(settings.storeUrl, Number(order.id));
      const revisionAfterLoad = decisionCacheRevisions.get(cacheKey) ?? 0;

      // Do not let a slower, older read overwrite a decision that another
      // mounted order view has just saved.
      if (
        revisionAfterLoad !== revisionBeforeLoad &&
        decisionCache.has(cacheKey)
      ) {
        setDecision(decisionCache.get(cacheKey) ?? null);
        return;
      }

      publishDecision(cacheKey, d);
      setDecisionError(null);
    } catch (e) {
      console.error('[FastDelivery] Failed to load decision:', e);
      setDecisionError("טעינת סוג המשלוח נכשלה");
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
      publishDecision(cacheKey, saved);
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
      } catch {
        return { ok: false as const };
      }
    },
    [settings?.storeUrl, order]
  );

  const autoDecideIfNeeded = useCallback(async () => {
    if (!settings?.storeUrl) return;

    // Only for full order details screen (needs shipping + items). If it's summary, skip.
    if (!("shipping" in order)) return;

    setDecisionError(null);
    setIsLoading(true);
    try {
      const existing = await getOrderDeliveryDecision(
        settings.storeUrl,
        Number(order.id)
      );
      const hasExplicitFastShipping = hasSelectedFastShipping(
        (order as OrderDetails).shipping_lines
      );

      // Preserve intentional manual choices. Automatic/needs-review decisions
      // may be repaired when WooCommerce already contains an explicit fast
      // shipping service.
      if (existing?.override || existing?.decisionState === "manual") {
        publishDecision(cacheKey, existing);
        return;
      }

      const shouldRepairExisting = Boolean(
        existing &&
        hasExplicitFastShipping &&
        (existing.deliveryType !== "fast" ||
          existing.decisionState === "needs_review")
      );

      if (existing && !shouldRepairExisting) {
        publishDecision(cacheKey, existing);
        return;
      }

      if (!rules && !hasExplicitFastShipping) return;

      let res: DecideFastDeliveryResult;
      if (hasExplicitFastShipping) {
        res = {
          deliveryType: "fast" as const,
          decisionState: "auto" as const,
          checks: [
            { label: "שיטת משלוח מהיר נקבעה בחנות", ok: true },
          ],
        };
      } else {
        // Prefer explicit VIP membership flag from order/customers API.
        let isVipMember: boolean | null =
          typeof (order as OrderDetails).is_vip_member === "boolean"
            ? Boolean((order as OrderDetails).is_vip_member)
            : null;

        // Fallback role is kept only for backward compatibility.
        let role: string | null = null;
        if ((order as OrderDetails).customer_id && isVipMember === null) {
          try {
            const customer = await getCustomerById(
              Number((order as OrderDetails).customer_id)
            );
            if (typeof customer?.is_vip_member === "boolean") {
              isVipMember = customer.is_vip_member;
            }
            role = customer?.role ?? null;
          } catch {
            isVipMember = null;
            role = null;
          }
        }

        const city = (order as OrderDetails).shipping?.city || (order as OrderDetails).billing?.city || "";
        const lineItemNames = (order as OrderDetails).line_items?.map((li) => li.name).filter(Boolean) ?? [];

        res = decideFastDelivery({
          isVipMember,
          customerRole: role,
          city,
          lineItemNames,
          rules: rules!,
        });
      }

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
      setDecisionError("שמירת סוג המשלוח נכשלה");
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
      setDecisionError(null);
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
      } catch (e) {
        console.error('[FastDelivery] manualOverride error:', e);
        setDecisionError("שמירת סוג המשלוח נכשלה");
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
    setDecisionError(null);
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
    } catch (e) {
      console.error('[FastDelivery] retryWooSync error:', e);
      setDecisionError("עדכון ההערה ב־WooCommerce נכשל");
    } finally {
      setIsLoading(false);
    }
  }, [settings?.storeUrl, decision, order, persist, trySyncWooNote]);

  return {
    decision,
    isLoading,
    decisionError,
    loadDecision: load,
    autoDecideIfNeeded,
    manualOverride,
    retryWooSync,
  };
};
