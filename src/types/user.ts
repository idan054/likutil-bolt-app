export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: string;
  lastLogin?: string;
  showOnlyCompanies: string[]; // Add new field
}

export type UserRole = 'admin' | 'client';

export interface UserListItem extends User {
  storeUrl?: string;
  ordersCount?: number;
  lastActive?: string;
}