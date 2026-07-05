import type { DeliveryCheck, DeliveryDecisionState, DeliveryType, FastDeliveryRules } from "../../types/fastDelivery";
import type { OrderDetails, OrderSummary } from "../../types/order";
import { normalizeForMatch } from "../../utils/storeKey";

const containsAny = (haystack: string, needles: string[]) => {
  const h = normalizeForMatch(haystack);
  return needles.some((n) => {
    const nn = normalizeForMatch(n);
    return nn && h.includes(nn);
  });
};

export interface DecideFastDeliveryInput {
  isVipMember?: boolean | null;
  customerRole?: string | null;
  city?: string | null;
  lineItemNames: string[];
  rules: FastDeliveryRules;
}

export interface DecideFastDeliveryResult {
  deliveryType: DeliveryType;
  decisionState: DeliveryDecisionState;
  checks: DeliveryCheck[];
}

export const decideFastDelivery = (input: DecideFastDeliveryInput): DecideFastDeliveryResult => {
  const role = (input.customerRole || "").trim();
  const city = (input.city || "").trim();
  const rules = input.rules;

  const hasVipFlag = typeof input.isVipMember === "boolean";
  const isRoleKnown = !!role;
  const isCityKnown = !!city;
  const isVipKnown = hasVipFlag || isRoleKnown;
  const isVip = hasVipFlag ? Boolean(input.isVipMember) : (role ? rules.vipRoles.includes(role) : false);

  const cityMatch = city ? rules.cities.map(normalizeForMatch).includes(normalizeForMatch(city)) : false;

  const hasBlockedItem = input.lineItemNames.some((name) => containsAny(name, rules.blockedKeywords));

  const checks: DeliveryCheck[] = [
    { label: "לקוח VIP", ok: isVip },
    { label: "עיר זכאית מהיום להיום", ok: cityMatch },
    { label: "אין מוצר חסום", ok: !hasBlockedItem },
  ];

  // Needs review if core data is missing
  const needsReview =
    !isVipKnown ||
    !isCityKnown ||
    input.lineItemNames.length === 0;

  if (needsReview) {
    return {
      deliveryType: "regular",
      decisionState: "needs_review",
      checks: [
        ...checks,
        { label: "חסר מידע מלא (בדיקה ידנית)", ok: false },
      ],
    };
  }

  const eligible = isVip && cityMatch && !hasBlockedItem;

  return {
    deliveryType: eligible ? "fast" : "regular",
    decisionState: "auto",
    checks,
  };
};
