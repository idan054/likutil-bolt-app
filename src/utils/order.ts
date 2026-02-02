import { translations } from '../config/translations';

export const translateOrderStatus = (status: string): string => {
  const translatedStatus = translations.orderStatus[status as keyof typeof translations.orderStatus];
  return translatedStatus || status;
};

const normalizePaymentValue = (value?: string): string => {
  return (value || "").trim().toLowerCase();
};

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

// Move aggregation logic to separate file
export { aggregateOrderItems } from './order/aggregation';
