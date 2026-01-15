import { doc, getDoc, setDoc } from "firebase/firestore";
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
  const data = snap.data() as any;
  return {
    storeKey,
    orderId,
    deliveryType: data.deliveryType ?? "regular",
    decisionState: data.decisionState ?? "auto",
    override: !!data.override,
    checks: Array.isArray(data.checks) ? data.checks : [],
    wooSyncError: !!data.wooSyncError,
    wooLastSyncAt: typeof data.wooLastSyncAt === "string" ? data.wooLastSyncAt : undefined,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
  };
};

export const upsertOrderDeliveryDecision = async (
  storeUrl: string,
  decision: Omit<OrderDeliveryDecision, "storeKey" | "updatedAt"> & {
    updatedAt?: string;
  }
): Promise<OrderDeliveryDecision> => {
  const storeKey = normalizeStoreKey(storeUrl);
  const ref = doc(db, COLLECTION, makeId(storeKey, decision.orderId));
  const next: OrderDeliveryDecision = {
    storeKey,
    orderId: decision.orderId,
    deliveryType: decision.deliveryType,
    decisionState: decision.decisionState,
    override: decision.override,
    checks: decision.checks ?? [],
    wooSyncError: decision.wooSyncError,
    wooLastSyncAt: decision.wooLastSyncAt,
    updatedAt: decision.updatedAt ?? new Date().toISOString(),
  };
  await setDoc(ref, next, { merge: true });
  return next;
};
