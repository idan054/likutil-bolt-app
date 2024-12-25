import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { settingsStorage } from './storage';
import type { UserSettings } from '../../types/settings';

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      
      // Create settings object from user data
      const settings: UserSettings = {
        storeUrl: userData.storeUrl,
        consumerKey: userData.consumerKey,
        consumerSecret: userData.consumerSecret,
        lastUpdated: userData.lastLogin || userData.createdAt,
      };

      // Save to local storage for API client
      settingsStorage.set(settings);
      
      return settings;
    }
    
    return null;
  } catch (error) {
    console.error('[settings.service] Failed to get user settings:', error);
    throw error;
  }
};

// Keep this as a no-op since we don't need to save settings separately anymore
export const saveUserSettings = async (userId: string, settings: UserSettings): Promise<void> => {
  // Settings are now saved as part of the user document during auth
  settingsStorage.set(settings);
};