export const sanitizeUrl = (url: string): string => {

  try {
    const urlObject = new URL(url);
    return urlObject.hostname.toLowerCase();
  } catch (error) {
    // If URL is invalid, return the original string
    /// OLD Method: 
    

  // Remove protocol (http:// or https://)
  let cleanUrl = url.replace(/^https?:\/\//, '');

  // Remove www. prefix if present
  // NOTE: Commented out - removing www. causes CORS redirect issues on some sites
  // cleanUrl = cleanUrl.replace(/^www\./, '');

  // Remove everything after the first slash
  cleanUrl = cleanUrl.split('/')[0];

  // Convert to lowercase
  cleanUrl = cleanUrl.toLowerCase();

  // Remove trailing slashes
  cleanUrl = cleanUrl.replace(/\/+$/, '');

  return cleanUrl;
  }


};
