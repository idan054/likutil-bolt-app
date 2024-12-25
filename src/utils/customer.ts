import { translations } from '../config/translations';

export const translateRole = (role: string | null | undefined): string => {
  if (!role || role === '0') return translations.roles.guest;
  
  const translatedRole = translations.roles[role as keyof typeof translations.roles];
  return translatedRole || translations.roles.guest;
};