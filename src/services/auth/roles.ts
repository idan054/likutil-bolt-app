import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { UserRole } from '../../types/user';

export const getUserRole = async (userId: string): Promise<UserRole> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return (userDoc.data()?.role || 'client') as UserRole;
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  await updateDoc(doc(db, 'users', userId), { role });
};