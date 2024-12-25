import type { DeliveryIntegration } from '../../types/delivery';

export const filterCompaniesByIds = (
  companies: DeliveryIntegration[],
  allowedIds: string[]
): DeliveryIntegration[] => {
  if (!Array.isArray(allowedIds) || allowedIds.length === 0) {
    return [];
  }

  return companies.filter(company => allowedIds.includes(company.id));
};

export const sortCompaniesByConnection = (
  companies: DeliveryIntegration[],
  connectedIds: Set<string>
): DeliveryIntegration[] => {
  return [...companies].sort((a, b) => {
    const aConnected = connectedIds.has(a.id);
    const bConnected = connectedIds.has(b.id);
    if (aConnected && !bConnected) return -1;
    if (!aConnected && bConnected) return 1;
    return 0;
  });
};