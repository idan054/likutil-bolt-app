import type { UserRole } from '../../types/user';

export const isAdmin = (role?: UserRole | null): boolean => {
  return role === 'admin';
};

export const translateRole = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'מנהל';
    case 'client':
      return 'לקוח';
    default:
      return 'לקוח';
  }
};