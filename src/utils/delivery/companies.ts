import type { DeliveryIntegration } from '../../types/delivery';

export const filterCompaniesByIds = (
  companies: DeliveryIntegration[],
  allowedIds: string[]
): DeliveryIntegration[] => {


  return companies; // AKA Show All - Filter Diasbled

  // Collection "users" -> "showOnlyCompanies" field is an array of company IDs
  if (!Array.isArray(allowedIds) || allowedIds.length === 0) {
    return [];
  }

  let filteredCompanies = companies.filter(company => allowedIds.includes(company.provider));
  console.log('filteredCompanies');
  console.log(filteredCompanies.length);
  console.log(filteredCompanies);


  return companies;
};

export const sortCompaniesByConnection = (
  companies: DeliveryIntegration[],
  connectedIds: Set<string>
): DeliveryIntegration[] => {
  return [...companies].sort((a, b) => {
    const aConnected = connectedIds.has(a.provider);
    const bConnected = connectedIds.has(b.provider);
    if (aConnected && !bConnected) return -1;
    if (!aConnected && bConnected) return 1;
    return 0;
  });
};

export const getConnectedCompanies = (
  companies: DeliveryIntegration[],
  connectedIds: Set<string>
): DeliveryIntegration[] => {
  return companies.filter(company => connectedIds.has(company.provider));
};
