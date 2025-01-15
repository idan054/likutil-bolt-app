import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { validateSettings } from './validation';
import type { UserSettings } from '../../types/settings';

export const updateUserSettings = async (
  userId: string, 
  settings: Partial<UserSettings>
): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, { settings });
};