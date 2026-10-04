import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import type { FastDeliveryRules } from "../../types/fastDelivery";
import { normalizeLine, normalizeStoreKey } from "../../utils/storeKey";

const COLLECTION = "fast_delivery_rules_v1";
const DEFAULT_BLOCKED_PRICE_THRESHOLD = 2000;
const DEFAULT_RULES_UPDATED_AT = "1970-01-01T00:00:00.000Z";

const normalizeIds = (values: unknown): number[] => {
  if (!Array.isArray(values)) return [];

  return Array.from(
    new Set(
      values
        .map(Number)
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  );
};

const normalizePriceThreshold = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_BLOCKED_PRICE_THRESHOLD;
};

const defaultRules = (storeKey: string): FastDeliveryRules => ({
  storeKey,
  cities: [],
  blockedKeywords: [],
  blockedProductIds: [],
  blockedCategoryIds: [],
  blockedPriceThreshold: DEFAULT_BLOCKED_PRICE_THRESHOLD,
  vipRoles: ["wholesale_customer", "primum"],
  updatedAt: DEFAULT_RULES_UPDATED_AT,
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
    blockedProductIds: normalizeIds(data.blockedProductIds),
    blockedCategoryIds: normalizeIds(data.blockedCategoryIds),
    blockedPriceThreshold: normalizePriceThreshold(data.blockedPriceThreshold),
    vipRoles: Array.isArray(data.vipRoles)
      ? data.vipRoles.map((v) => (v || "").trim()).filter(Boolean)
      : defaultRules(storeKey).vipRoles,
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : DEFAULT_RULES_UPDATED_AT,
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
    blockedProductIds: normalizeIds(rules.blockedProductIds),
    blockedCategoryIds: normalizeIds(rules.blockedCategoryIds),
    blockedPriceThreshold: normalizePriceThreshold(rules.blockedPriceThreshold),
    vipRoles: rules.vipRoles.map((v) => (v || "").trim()).filter(Boolean),
    updatedBy: rules.updatedBy,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(ref, next, { merge: true });
  return next;
};
