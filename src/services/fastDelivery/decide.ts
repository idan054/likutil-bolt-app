import type {
  DeliveryCheck,
  DeliveryDecisionState,
  DeliveryType,
  FastDeliveryLineItem,
  FastDeliveryRules,
  OrderDeliveryDecision,
} from "../../types/fastDelivery";
import { normalizeForMatch } from "../../utils/storeKey";

const normalizeMatchText = (value: string | null | undefined) =>
  normalizeForMatch((value || "").normalize("NFKC"))
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const containsKeyword = (value: string, keywords: string[]) => {
  const normalizedValue = normalizeMatchText(value);
  return keywords.find((keyword) => {
    const normalizedKeyword = normalizeMatchText(keyword);
    return normalizedKeyword && normalizedValue.includes(normalizedKeyword);
  });
};

const getCityCandidates = (city: string) => {
  const candidates = new Set<string>();
  const addCandidate = (value: string) => {
    const normalized = normalizeMatchText(value);
    if (normalized) candidates.add(normalized);
  };

  addCandidate(city);
  city.split(/\s+[–—-]\s+|[,;]/u).forEach(addCandidate);
  return candidates;
};

const getBlockedProduct = (
  item: FastDeliveryLineItem,
  rules: FastDeliveryRules
) => {
  if (item.productId && rules.blockedProductIds.includes(item.productId)) {
    return `מזהה מוצר ${item.productId} מוגדר כחסום`;
  }

  const blockedCategory = item.categories.find((category) =>
    category.id ? rules.blockedCategoryIds.includes(category.id) : false
  );
  if (blockedCategory) {
    return `קטגוריה חסומה: ${blockedCategory.name}`;
  }

  // Configured category IDs are authoritative when category data is available.
  // Otherwise use a conservative name + price fallback.
  if (rules.blockedCategoryIds.length === 0 || !item.categoryDataComplete) {
    const keyword = containsKeyword(item.name, rules.blockedKeywords);
    const price = Number(item.unitPrice);
    if (
      keyword &&
      Number.isFinite(price) &&
      price >= rules.blockedPriceThreshold
    ) {
      return `שם המוצר תואם לכלל "${keyword}" ומחירו ${price.toLocaleString()} במטבע החנות`;
    }
  }

  return null;
};

export interface DecideFastDeliveryInput {
  isVipMember?: boolean | null;
  customerRole?: string | null;
  city?: string | null;
  lineItems: FastDeliveryLineItem[];
  rules: FastDeliveryRules;
}

export interface DecideFastDeliveryResult {
  deliveryType: DeliveryType;
  decisionState: DeliveryDecisionState;
  checks: DeliveryCheck[];
}

export const buildFastDeliveryInputFingerprint = (
  input: Omit<DecideFastDeliveryInput, "rules">
) => {
  const items = input.lineItems
    .map((item) => ({
      productId: item.productId ?? null,
      variationId: item.variationId ?? null,
      sku: item.sku || "",
      name: normalizeMatchText(item.name),
      unitPrice: Number.isFinite(Number(item.unitPrice))
        ? Number(item.unitPrice)
        : null,
      categoryDataComplete: item.categoryDataComplete,
      categories: item.categories
        .map((category) => ({
          id: category.id ?? null,
          name: normalizeMatchText(category.name),
          slug: normalizeMatchText(category.slug),
        }))
        .sort((left, right) =>
          `${left.id}:${left.name}:${left.slug}`.localeCompare(
            `${right.id}:${right.name}:${right.slug}`
          )
        ),
    }))
    .sort((left, right) =>
      `${left.productId}:${left.variationId}:${left.name}`.localeCompare(
        `${right.productId}:${right.variationId}:${right.name}`
      )
    );

  return JSON.stringify({
    isVipMember:
      typeof input.isVipMember === "boolean" ? input.isVipMember : null,
    customerRole: (input.customerRole || "").trim(),
    city: normalizeMatchText(input.city),
    items,
  });
};

export const shouldRecalculateAutomaticDecision = (input: {
  existing: OrderDeliveryDecision | null;
  rulesUpdatedAt: string;
  inputFingerprint: string;
}) => {
  const { existing, rulesUpdatedAt, inputFingerprint } = input;
  if (!existing) return true;
  if (existing.override || existing.decisionState === "manual") return false;

  return (
    existing.rulesUpdatedAt !== rulesUpdatedAt ||
    existing.inputFingerprint !== inputFingerprint
  );
};

export const decideFastDelivery = (
  input: DecideFastDeliveryInput
): DecideFastDeliveryResult => {
  const role = (input.customerRole || "").trim();
  const city = (input.city || "").trim();
  const rules = input.rules;

  const hasVipFlag = typeof input.isVipMember === "boolean";
  const isRoleKnown = Boolean(role);
  const isCityKnown = Boolean(city);
  const isVipKnown = hasVipFlag || isRoleKnown;
  const isVip = hasVipFlag
    ? Boolean(input.isVipMember)
    : role
      ? rules.vipRoles.includes(role)
      : false;

  const cityCandidates = getCityCandidates(city);
  const matchedCity = rules.cities.find((ruleCity) =>
    cityCandidates.has(normalizeMatchText(ruleCity))
  );
  const cityMatch = Boolean(matchedCity);

  let blockedItem: FastDeliveryLineItem | null = null;
  let blockedReason: string | null = null;
  for (const item of input.lineItems) {
    const reason = getBlockedProduct(item, rules);
    if (!reason) continue;
    blockedItem = item;
    blockedReason = reason;
    break;
  }

  const categoryRulesActive = rules.blockedCategoryIds.length > 0;
  const incompleteCategoryItem = categoryRulesActive
    ? input.lineItems.find((item) => !item.categoryDataComplete)
    : undefined;

  const checks: DeliveryCheck[] = [
    { label: "לקוח VIP", ok: isVip },
    {
      label: "עיר זכאית מהיום להיום",
      ok: cityMatch,
      detail: cityMatch
        ? `העיר התאימה לכלל "${matchedCity}"`
        : city
          ? `לא נמצאה התאמה עבור "${city}"`
          : "עיר חסרה",
    },
    {
      label: "אין מוצר חסום",
      ok: !blockedItem,
      ...(blockedItem && blockedReason
        ? { detail: `${blockedItem.name}: ${blockedReason}` }
        : {}),
    },
  ];

  const needsReview =
    !isVipKnown ||
    !isCityKnown ||
    input.lineItems.length === 0 ||
    (!blockedItem && Boolean(incompleteCategoryItem));

  if (needsReview) {
    return {
      deliveryType: "regular",
      decisionState: "needs_review",
      checks: [
        ...checks,
        {
          label: "חסר מידע מלא (בדיקה ידנית)",
          ok: false,
          ...(incompleteCategoryItem
            ? { detail: `לא ניתן לאמת קטגוריה עבור "${incompleteCategoryItem.name}"` }
            : {}),
        },
      ],
    };
  }

  const eligible = isVip && cityMatch && !blockedItem;

  return {
    deliveryType: eligible ? "fast" : "regular",
    decisionState: "auto",
    checks,
  };
};
