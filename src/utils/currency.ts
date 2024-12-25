export const formatCurrency = (amount: string): string => {
  const number = parseFloat(amount);
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
  }).format(number);
};