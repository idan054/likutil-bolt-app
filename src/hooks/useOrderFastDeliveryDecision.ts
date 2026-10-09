import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import type { OrderDetails, OrderSummary } from "../types/order";
import type {
  FastDeliveryLineItem,
  FastDeliveryProductCategory,
  FastDeliveryRules,
  OrderDeliveryDecision,
  DeliveryType,
} from "../types/fastDelivery";
import { useSettings } from "./useSettings";
import { useFastDeliveryRules } from "./useFastDeliveryRules";
import { getOrderDeliveryDecision, upsertOrderDeliveryDecision } from "../services/fastDelivery/decision.service";
import {
  buildFastDeliveryInputFingerprint,
  decideFastDelivery,
  shouldRecalculateAutomaticDecision,
  type DecideFastDeliveryResult,
} from "../services/fastDelivery/decide";
import { getProductCategoriesByIds } from "../services/fastDelivery/product-categories.service";
import { getCustomerById } from "../services/customers/customers.service";
import { createOrderNote } from "../services/orders/notes.service";
import { hasSelectedFastShipping } from "../utils/shippingMethod";
import { siteDeliveryType } from "../utils/siteCarrier";

/** `rulesUpdatedAt` of a decision that came from the shop site's routing decision (order.s3_carrier). */
const SITE_DECISION_MARK = "site-carrier";

const decisionCache = new Map<string, OrderDeliveryDecision | null>();
const decisionListeners = new Map<
  string,
  Set<(decision: OrderDeliveryDecision | null) => void>
>();
const decisionCacheRevisions = new Map<string, number>();
const automaticDecisionRequests = new Map<string, Promise<void>>();

const buildDecisionLineItems = async (input: {
  order: OrderDetails;
  rules: FastDeliveryRules;
  storeUrl: string;
  platform: "woo" | "shopify" | undefined;
}): Promise<FastDeliveryLineItem[]> => {
  const { order, rules, storeUrl, platform } = input;
  const categoryRulesActive = rules.blockedCategoryIds.length > 0;

  const productIdsMissingCategories = categoryRulesActive
    ? order.line_items
        .filter((item) => !(item.product_data?.categories?.length))
        .map((item) => Number(item.product_id))
        .filter((productId) => Number.isInteger(productId) && productId > 0)
    : [];

  let categoriesByProductId = new Map<
    number,
    FastDeliveryProductCategory[] | null
  >();
  if (
    categoryRulesActive &&
    platform !== "shopify" &&
    productIdsMissingCategories.length > 0
  ) {
    try {
      categoriesByProductId = await getProductCategoriesByIds(
        storeUrl,
        productIdsMissingCategories
      );
    } catch (error) {
      console.error("[FastDelivery] Product category lookup failed:", error);
    }
  }

  return order.line_items.map((item) => {
    const embeddedCategories = item.product_data?.categories ?? [];
    const fetchedCategories = categoriesByProductId.get(Number(item.product_id));
    const categories = embeddedCategories.length
      ? embeddedCategories
      : fetchedCategories ?? [];

    return {
      productId: Number(item.product_id) || undefined,
      variationId: Number(item.variation_id) || undefined,
      sku: item.sku || undefined,
      name: item.name,
      unitPrice: Number.isFinite(Number(item.price)) ? Number(item.price) : undefined,
      categories,
      categoryDataComplete:
        !categoryRulesActive || embeddedCategories.length > 0 || categories.length > 0,
    };
  });
};

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
    const inFlightRequest = automaticDecisionRequests.get(cacheKey);
    if (inFlightRequest) {
      try {
        await inFlightRequest;
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const request = (async () => {
      try {
      const existing = await getOrderDeliveryDecision(
        settings.storeUrl,
        Number(order.id)
      );
      const hasExplicitFastShipping = hasSelectedFastShipping(
        (order as OrderDetails).shipping_lines
      );

      // Manual choices are always authoritative and are never recalculated.
      if (existing?.override || existing?.decisionState === "manual") {
        publishDecision(cacheKey, existing);
        return;
      }

      let res: DecideFastDeliveryResult;
      let rulesUpdatedAt: string;
      let inputFingerprint: string;

      const siteCarrier = (order as OrderDetails).s3_carrier;
      const siteType = siteDeliveryType(siteCarrier);

      // A decision taken from the site stays as it is after the site stops sending one (it stops once a
      // shipment is opened). Recalculating from the old rules would flip the type and add a second note.
      if (!siteType && existing?.rulesUpdatedAt === SITE_DECISION_MARK) {
        publishDecision(cacheKey, existing);
        return;
      }

      if (siteType) {
        // The shop site decided which courier takes this order (order.s3_carrier): that is the delivery type.
        rulesUpdatedAt = SITE_DECISION_MARK;
        inputFingerprint = JSON.stringify({
          use: siteCarrier?.use ?? "",
          upgrade: Boolean(siteCarrier?.upgrade),
        });

        if (
          !shouldRecalculateAutomaticDecision({
            existing,
            rulesUpdatedAt,
            inputFingerprint,
          })
        ) {
          publishDecision(cacheKey, existing);
          return;
        }

        const siteLabel = "לפי ההחלטה של האתר";
        res = {
          deliveryType: siteType,
          decisionState: "auto" as const,
          // Firestore rejects undefined values, so `detail` is present only when there is a line.
          checks: [siteCarrier?.line ? { label: siteLabel, ok: true, detail: siteCarrier.line } : { label: siteLabel, ok: true }],
        };
      } else if (hasExplicitFastShipping) {
        rulesUpdatedAt = "woo-shipping-selection";
        inputFingerprint = JSON.stringify(
          (order as OrderDetails).shipping_lines.map((line) => ({
            methodId: line.method_id,
            methodTitle: line.method_title,
            instanceId: line.instance_id ?? null,
          }))
        );

        if (
          !shouldRecalculateAutomaticDecision({
            existing,
            rulesUpdatedAt,
            inputFingerprint,
          })
        ) {
          publishDecision(cacheKey, existing);
          return;
        }

        res = {
          deliveryType: "fast" as const,
          decisionState: "auto" as const,
          checks: [
            {
              label: "שיטת משלוח מהיר נקבעה בחנות",
              ok: true,
              detail: (order as OrderDetails).shipping_lines
                .map((line) => line.method_title)
                .filter(Boolean)
                .join(", "),
            },
          ],
        };
      } else {
        if (!rules) {
          if (existing) publishDecision(cacheKey, existing);
          return;
        }

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
        const lineItems = await buildDecisionLineItems({
          order: order as OrderDetails,
          rules,
          storeUrl: settings.storeUrl,
          platform: settings.authType,
        });

        const decisionInput = {
          isVipMember,
          customerRole: role,
          city,
          lineItems,
        };
        rulesUpdatedAt = rules.updatedAt;
        inputFingerprint = buildFastDeliveryInputFingerprint(decisionInput);

        if (
          !shouldRecalculateAutomaticDecision({
            existing,
            rulesUpdatedAt,
            inputFingerprint,
          })
        ) {
          publishDecision(cacheKey, existing);
          return;
        }

        res = decideFastDelivery({
          ...decisionInput,
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
        rulesUpdatedAt,
        inputFingerprint,
      };

      const saved = await persist(toSave);

      // Woo note always (per your choice)
      const noteText =
        res.decisionState === "needs_review"
          ? "סוג משלוח במערכת ליקוט: דורש בדיקה (חסר מידע מלא)"
          : `סוג משלוח במערכת ליקוט: ${res.deliveryType === "fast" ? "להיום" : "רגיל"} (אוטומטי)`;

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
      }
    })();

    automaticDecisionRequests.set(cacheKey, request);
    try {
      await request;
    } finally {
      if (automaticDecisionRequests.get(cacheKey) === request) {
        automaticDecisionRequests.delete(cacheKey);
      }
      setIsLoading(false);
    }
  }, [settings?.storeUrl, settings?.authType, rules, order, persist, trySyncWooNote, cacheKey]);

  const manualOverride = useCallback(
    async (type: DeliveryType) => {
      if (!settings?.storeUrl) return;

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
          rulesUpdatedAt: decision?.rulesUpdatedAt,
          inputFingerprint: decision?.inputFingerprint,
        };

        const saved = await persist(next);

        const noteText = `סוג משלוח במערכת ליקוט: ${type === "fast" ? "להיום" : "רגיל"} (שונה ידנית)`;
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
    [settings?.storeUrl, order, decision, persist, trySyncWooNote]
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
          ? `סוג משלוח במערכת ליקוט: ${decision.deliveryType === "fast" ? "להיום" : "רגיל"} (שונה ידנית)`
          : decision.decisionState === "needs_review"
            ? "סוג משלוח במערכת ליקוט: דורש בדיקה (חסר מידע מלא)"
            : `סוג משלוח במערכת ליקוט: ${decision.deliveryType === "fast" ? "להיום" : "רגיל"} (אוטומטי)`;

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
