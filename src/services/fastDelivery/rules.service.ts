import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import type { FastDeliveryRules } from "../../types/fastDelivery";
import { normalizeLine, normalizeStoreKey } from "../../utils/storeKey";

const COLLECTION = "fast_delivery_rules_v1";

const defaultRules = (storeKey: string): FastDeliveryRules => ({
  storeKey,
  cities: [],
  blockedKeywords: ["מדפסת"],
  vipRoles: ["wholesale_customer", "primum"],
  updatedAt: new Date().toISOString(),
});

export const getFastDeliveryRules = async (
  storeUrl: string
): Promise<FastDeliveryRules> => {
  const storeKey = normalizeStoreKey(storeUrl);
  const ref = doc(db, COLLECTION, storeKey);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const rules = defaultRules(storeKey);
    // Create a default doc (best effort). If it fails due to rules, we still return defaults.
    try {
      await setDoc(ref, rules, { merge: true });
    } catch {
      // ignore
    }
    return rules;
  }

  const data = snap.data() as Partial<FastDeliveryRules>;
  return {
    ...defaultRules(storeKey),
    ...data,
    storeKey,
    cities: Array.isArray(data.cities) ? data.cities.map(normalizeLine).filter(Boolean) : [],
    blockedKeywords: Array.isArray(data.blockedKeywords)
      ? data.blockedKeywords.map(normalizeLine).filter(Boolean)
      : defaultRules(storeKey).blockedKeywords,
    vipRoles: Array.isArray(data.vipRoles)
      ? data.vipRoles.map((v) => (v || "").trim()).filter(Boolean)
      : defaultRules(storeKey).vipRoles,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
  };
};

export const saveFastDeliveryRules = async (
  storeUrl: string,
  rules: Omit<FastDeliveryRules, "storeKey" | "updatedAt"> & { updatedBy?: string }
): Promise<FastDeliveryRules> => {
  const storeKey = normalizeStoreKey(storeUrl);
  const ref = doc(db, COLLECTION, storeKey);

  const next: FastDeliveryRules = {
    storeKey,
    cities: rules.cities.map(normalizeLine).filter(Boolean),
    blockedKeywords: rules.blockedKeywords.map(normalizeLine).filter(Boolean),
    vipRoles: rules.vipRoles.map((v) => (v || "").trim()).filter(Boolean),
    updatedBy: rules.updatedBy,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(ref, next, { merge: true });
  return next;
};
