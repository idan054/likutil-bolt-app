const digitsOnly = (phone: string): string => phone.replace(/\D/g, '');

export const formatPhoneForDisplay = (phone: string): string => {
  let digits = digitsOnly(phone);

  if (digits.startsWith('00972')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('9720')) {
    return digits.slice(3);
  }

  if (digits.startsWith('972')) {
    return `0${digits.slice(3)}`;
  }

  return digits;
};

export const formatPhoneForWhatsapp = (phone: string): string => {
  const localPhone = formatPhoneForDisplay(phone);

  if (localPhone.startsWith('0')) {
    return `972${localPhone.slice(1)}`;
  }

  return localPhone;
};
