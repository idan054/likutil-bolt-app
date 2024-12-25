import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLLECTIONS } from '../../config/constants';
import { encryptData, decryptData } from '../../utils/encryption';
import type { UserSettings, EncryptedSettings } from '../../types/settings';

export const saveSettingsToFirestore = async (
  userId: string, 
  settings: UserSettings
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.SETTINGS, userId);
  
  const encryptedSettings: EncryptedSettings = {
    storeUrl: settings.storeUrl,
    encryptedKey: encryptData(settings.consumerKey, userId),
    encryptedSecret: encryptData(settings.consumerSecret, userId),
    lastUpdated: new Date().toISOString(),
  };
  
  await setDoc(docRef, encryptedSettings);
};

export const getSettingsFromFirestore = async (
  userId: string
): Promise<UserSettings | null> => {
  const docRef = doc(db, COLLECTIONS.SETTINGS, userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const encryptedData = docSnap.data() as EncryptedSettings;
  
  return {
    storeUrl: encryptedData.storeUrl,
    consumerKey: decryptData(encryptedData.encryptedKey, userId),
    consumerSecret: decryptData(encryptedData.encryptedSecret, userId),
    lastUpdated: encryptedData.lastUpdated,
  };
};