import { sanitizeUrl } from './url';

export const getProductUrl = (storeUrl?: string, permalink?: string): string => {
  if (!storeUrl || !permalink) return '#';
  
  // If permalink is already a full URL, return it
  if (permalink.startsWith('http')) {
    return permalink;
  }
  
  // Otherwise, construct the full URL
  const cleanStoreUrl = sanitizeUrl(storeUrl);
  return `https://${cleanStoreUrl}${permalink.startsWith('/') ? '' : '/'}${permalink}`;
};