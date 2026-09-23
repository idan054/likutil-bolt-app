import type { OrderSummary } from "../types/order";
import type { DeliveryDecisionState, DeliveryType } from "../types/fastDelivery";

type ShippingLine = OrderSummary["shipping_lines"][number];

const normalizeShippingValue = (value: string | null | undefined) =>
  (value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const includesAny = (value: string, candidates: string[]) =>
  candidates.some((candidate) => value.includes(candidate));

export const isPickupShippingLine = (
  shippingLine: ShippingLine | null | undefined
) => {
  if (!shippingLine) return false;

  const methodId = normalizeShippingValue(shippingLine.method_id);
  const title = normalizeShippingValue(shippingLine.method_title);

  return (
    methodId === "local pickup" ||
    includesAny(title, ["איסוף", "pickup", "local pickup"])
  );
};

export const isFastShippingLine = (
  shippingLine: ShippingLine | null | undefined
) => {
  if (!shippingLine || isPickupShippingLine(shippingLine)) return false;

  const methodId = normalizeShippingValue(shippingLine.method_id);
  const title = normalizeShippingValue(shippingLine.method_title);
  const shippingMethod = `${methodId} ${title}`;

  return includesAny(shippingMethod, [
    "מהיר",
    "מהיום להיום",
    "היום להיום",
    "fast",
    "same day",
  ]);
};

export const hasSelectedFastShipping = (
  shippingLines: OrderSummary["shipping_lines"] | null | undefined
) => Boolean(shippingLines?.some(isFastShippingLine));

export const getOrderDeliveryBadgeType = (
  shippingLines: OrderSummary["shipping_lines"] | null | undefined,
  decision?: {
    deliveryType?: DeliveryType;
    decisionState?: DeliveryDecisionState;
  } | null
): "fast" | "regular" | "needs_review" | "pickup" => {
  if (shippingLines?.some(isPickupShippingLine)) return "pickup";

  // A manual choice takes precedence over an automatic classification.
  if (decision?.decisionState === "manual" && decision.deliveryType) {
    return decision.deliveryType;
  }

  if (hasSelectedFastShipping(shippingLines)) return "fast";
  if (decision?.decisionState === "needs_review") return "needs_review";
  return decision?.deliveryType ?? "regular";
};

export const sortOrdersByDeliveryPriority = (
  orders: OrderSummary[],
  fastByOrderId: Record<number, boolean>
): OrderSummary[] =>
  orders
    .map((order, index) => ({
      order,
      index,
      isFast:
        fastByOrderId[order.id] ??
        (getOrderDeliveryBadgeType(order.shipping_lines) === "fast"),
    }))
    .sort((a, b) => Number(b.isFast) - Number(a.isFast) || a.index - b.index)
    .map(({ order }) => order);
