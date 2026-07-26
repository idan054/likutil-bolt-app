import type { OrderSummary } from "../types/order";

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
