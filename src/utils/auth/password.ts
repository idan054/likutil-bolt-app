import SHA256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

const SALT_PREFIX = 'likutil-v2';
const SALT_SUFFIX = 'secure-access';

export const generateStorePassword = (storeUrl: string): string => {
  const cleanUrl = storeUrl.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const hashInput = `${SALT_PREFIX}${cleanUrl}${SALT_SUFFIX}`;
  const hash = SHA256(hashInput).toString(Base64);


  const urlSafeHash = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return urlSafeHash.slice(0, 16); // Return the first 16 characters
};
