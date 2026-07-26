
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

const normalizeDeliveryText = (value: string): string =>
  value
    .normalize('NFKC')
    .replace(/[\p{Cc}\p{Cf}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const sanitizeDeliveryContactName = (name: string): string =>
  normalizeDeliveryText(name)
    .replace(/['’`"]+/g, '')
    .replace(/[^\p{L}\p{N}\s.-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const sanitizeDeliveryCity = (city: string): string =>
  normalizeDeliveryText(city)
    .replace(/['’`"@&<>[\]{}\\|^~]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s.()-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const sanitizeDeliveryAddress = (address: string): string =>
  normalizeDeliveryText(address)
    .replace(/['’`"@&<>[\]{}\\|^~]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s.,()/#:-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const sanitizeDeliveryNote = (note: string): string =>
  normalizeDeliveryText(note)
    .replace(/['’`"@&<>[\]{}\\|^~]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s.,()/#:;!?%+-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const sanitizeDeliveryEmail = (email: string): string =>
  normalizeDeliveryText(email).replace(/\s+/g, '');
