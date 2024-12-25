import { AES, enc } from 'crypto-js';

// Use a combination of user ID and a constant salt for the encryption key
const getEncryptionKey = (userId: string): string => {
  const SALT = 'likutil-settings-v1';
  return `${userId}-${SALT}`;
};

export const encryptData = (data: string, userId: string): string => {
  return AES.encrypt(data, getEncryptionKey(userId)).toString();
};

export const decryptData = (encryptedData: string, userId: string): string => {
  const bytes = AES.decrypt(encryptedData, getEncryptionKey(userId));
  return bytes.toString(enc.Utf8);
};