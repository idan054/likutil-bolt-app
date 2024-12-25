import { ENCRYPTION_SALT } from './constants';

export const getEncryptionKey = (userId: string): string => {
  return `${userId}-${ENCRYPTION_SALT}`;
};