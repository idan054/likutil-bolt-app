
export const getDeliveryProviderTitle = (provider: string): string => {
  switch (provider) {
    case 'mahirLi':
      return 'מהיר לי';
    case 'cargo':
      return 'Cargo';
    case 'sale4u':
      return 'Sale4U';
    default:
      return provider;
  }
};

export const getDeliveryUrl = (provider: string): string => {
  
  switch (provider) {
    case 'cargo':
      return 'https://www.cargo-ship.co.il/Baldar/Deliveries.aspx';
    case 'sale4u':
      return 'http://185.108.80.50:8050/baldar/Deliveries.aspx';
    default:
      return '#';
  }
};

export const sanitizeDeliveryContactName = (name: string): string =>
  name
    .normalize('NFKC')
    .replace(/['’`"]+/g, '')
    .replace(/[^\p{L}\p{N}\s.-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
