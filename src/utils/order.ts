import { translations } from '../config/translations';

export const translateOrderStatus = (status: string): string => {
  const translatedStatus = translations.orderStatus[status as keyof typeof translations.orderStatus];
  return translatedStatus || status;
};

// Move aggregation logic to separate file
export { aggregateOrderItems } from './order/aggregation';