export const sanitizeUrl = (url: string): string => {
  // Remove protocol (http:// or https://)
  let cleanUrl = url.replace(/^https?:\/\//, '');

  // Remove trailing slashes
  cleanUrl = cleanUrl.replace(/\/+$/, '');

  // Remove www. prefix if present
  cleanUrl = cleanUrl.replace(/^www\./, '');

  // Convert to lowercase
  cleanUrl = cleanUrl.toLowerCase();

  return cleanUrl;
};
