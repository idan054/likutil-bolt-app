export const formatPhoneForWhatsapp = (phone: string): string => {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If the number starts with '0', replace it with '972'
  if (digits.startsWith('0')) {
    return '972' + digits.slice(1);
  }
  
  return digits;
};