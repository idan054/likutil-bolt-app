import { translations } from '../config/translations';

export const translateOrderStatus = (status: string): string => {
  const translatedStatus = translations.orderStatus[status as keyof typeof translations.orderStatus];
  return translatedStatus || status;
};

const normalizePaymentValue = (value?: string): string => {
  return (value || "").trim().toLowerCase();
};

const normalizeShippingValue = (value?: string): string => {
  return (value || "").trim().toLowerCase();
};

const localPickupKeywords = [
  "local_pickup",
  "local pickup",
  "local-pickup",
  "pickup",
  "self pickup",
  "self-pickup",
  "store pickup",
  "store-pickup",
  "pickup point",
  "pickup-point",
  "איסוף",
  "איסוף עצמי",
  "נקודת איסוף",
  "נקודות איסוף",
  "נקודת חלוקה",
  "נקודות חלוקה"
];

export const isOtherPaymentMethod = (
  paymentMethodTitle?: string,
  paymentMethod?: string
): boolean => {
  const normalizedTitle = normalizePaymentValue(paymentMethodTitle);
  const normalizedMethod = normalizePaymentValue(paymentMethod);
  return (
    normalizedTitle === "אחר" ||
    normalizedTitle.includes("אחר") ||
    normalizedTitle === "other" ||
    normalizedTitle.includes("other") ||
    normalizedMethod === "אחר" ||
    normalizedMethod.includes("אחר") ||
    normalizedMethod === "other" ||
    normalizedMethod.includes("other")
  );
};

export const isProcessingStatus = (status?: string): boolean => {
  const normalizedStatus = (status || "").trim().toLowerCase();
  return (
    normalizedStatus === "processing" ||
    normalizedStatus === "pending" ||
    normalizedStatus === "בטיפול"
  );
};

export const isOtherPaymentProcessing = (
  status?: string,
  paymentMethodTitle?: string,
  paymentMethod?: string
): boolean => {
  return isOtherPaymentMethod(paymentMethodTitle, paymentMethod) && isProcessingStatus(status);
};

export const isLocalPickupShipping = (
  shippingLines?: Array<{ method_id?: string; method_title?: string }>
): boolean => {
  if (!shippingLines || shippingLines.length === 0) return false;
  return shippingLines.some((line) => {
    const methodId = normalizeShippingValue(line?.method_id);
    const methodTitle = normalizeShippingValue(line?.method_title);
    return localPickupKeywords.some(
      (keyword) =>
        (methodId && methodId.includes(keyword)) ||
        (methodTitle && methodTitle.includes(keyword))
    );
  });
};

// Move aggregation logic to separate file
export { aggregateOrderItems } from './order/aggregation';
