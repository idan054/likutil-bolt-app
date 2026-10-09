import { deleteField, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import type { OrderDeliveryDecision } from "../../types/fastDelivery";
import { normalizeStoreKey } from "../../utils/storeKey";

const COLLECTION = "fast_delivery_decisions_v1";

const makeId = (storeKey: string, orderId: number) => `${storeKey}__${orderId}`;

export const getOrderDeliveryDecision = async (
  storeUrl: string,
  orderId: number
): Promise<OrderDeliveryDecision | null> => {
  const storeKey = normalizeStoreKey(storeUrl);
  const ref = doc(db, COLLECTION, makeId(storeKey, orderId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    storeKey,
    orderId,
    deliveryType: data.deliveryType ?? "regular",
    decisionState: data.decisionState ?? "auto",
    override: !!data.override,
    checks: Array.isArray(data.checks) ? data.checks : [],
    wooSyncError: !!data.wooSyncError,
    wooLastSyncAt: typeof data.wooLastSyncAt === "string" ? data.wooLastSyncAt : undefined,
    rulesUpdatedAt:
      typeof data.rulesUpdatedAt === "string" ? data.rulesUpdatedAt : undefined,
    inputFingerprint:
      typeof data.inputFingerprint === "string" ? data.inputFingerprint : undefined,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
  };
};

export const upsertOrderDeliveryDecision = async (
  storeUrl: string,
  decision: Omit<OrderDeliveryDecision, "storeKey" | "updatedAt"> & {
    updatedAt?: string;
  }
): Promise<OrderDeliveryDecision> => {
  // All decision routes share this boundary. Optional fields are omitted only
  // when absent; invalid business data must never be silently coerced or saved.
  if (
    !Number.isSafeInteger(decision.orderId) || decision.orderId <= 0 ||
    !["fast", "regular"].includes(decision.deliveryType) ||
    !["auto", "manual", "needs_review"].includes(decision.decisionState) ||
    typeof decision.override !== "boolean" ||
    !Array.isArray(decision.checks) ||
    (decision.wooSyncError !== undefined && typeof decision.wooSyncError !== "boolean")
  ) {
    throw new Error("Invalid delivery decision");
  }
  for (const key of ["wooLastSyncAt", "rulesUpdatedAt", "inputFingerprint", "updatedAt"] as const) {
    if (decision[key] !== undefined && typeof decision[key] !== "string") {
      throw new Error(`Invalid delivery decision ${key}`);
    }
  }
  const checks = decision.checks.map((check) => {
    if (
      !check || typeof check.label !== "string" || !check.label.trim() ||
      typeof check.ok !== "boolean" ||
      (check.detail !== undefined && typeof check.detail !== "string")
    ) {
      throw new Error("Invalid delivery decision check");
    }
    return {
      label: check.label,
      ok: check.ok,
      ...(check.detail !== undefined ? { detail: check.detail } : {}),
    };
  });
  const storeKey = normalizeStoreKey(storeUrl);
  const ref = doc(db, COLLECTION, makeId(storeKey, decision.orderId));
  const next: OrderDeliveryDecision = {
    storeKey,
    orderId: decision.orderId,
    deliveryType: decision.deliveryType,
    decisionState: decision.decisionState,
    override: decision.override,
    checks,
    wooSyncError: decision.wooSyncError ?? false,
    updatedAt: decision.updatedAt ?? new Date().toISOString(),
  };

  if (typeof decision.wooLastSyncAt === "string") {
    next.wooLastSyncAt = decision.wooLastSyncAt;
  }
  if (typeof decision.rulesUpdatedAt === "string") {
    next.rulesUpdatedAt = decision.rulesUpdatedAt;
  }
  if (typeof decision.inputFingerprint === "string") {
    next.inputFingerprint = decision.inputFingerprint;
  }

  await setDoc(
    ref,
    {
      ...next,
      // Firestore rejects `undefined`. Clear an older timestamp explicitly
      // while a fresh WooCommerce note sync is still pending.
      wooLastSyncAt: next.wooLastSyncAt ?? deleteField(),
    },
    { merge: true }
  );
  return next;
};
