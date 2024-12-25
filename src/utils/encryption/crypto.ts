import { AES, enc } from 'crypto-js';
import { getEncryptionKey } from './keys';

export const encryptData = (data: string, userId: string): string => {
  return AES.encrypt(data, getEncryptionKey(userId)).toString();
};

export const decryptData = (encryptedData: string, userId: string): string => {
  const bytes = AES.decrypt(encryptedData, getEncryptionKey(userId));
  return bytes.toString(enc.Utf8);
};