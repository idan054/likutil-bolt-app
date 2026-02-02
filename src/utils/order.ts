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
  return normalizedTitle === "אחר" || normalizedTitle === "other" || normalizedMethod === "other";
};



// Move aggregation logic to separate file
export { aggregateOrderItems } from './order/aggregation';
