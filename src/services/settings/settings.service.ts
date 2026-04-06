import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { settingsStorage } from "./storage";
import type { UserSettings } from "../../types/settings";

export const getUserSettings = async (
  userId: string
): Promise<UserSettings | null> => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    console.log("userId", userId);
    console.log("docSnap", docSnap.data());

    if (docSnap.exists()) {
      const userData = docSnap.data();

      // Get favicon to use it in const settings: UserSettings = {

      // Create settings object from user data
      const settings: UserSettings = {
        storeUrl: userData?.storeUrl,
        businessPhone: userData?.businessPhone,
        accessToken: userData?.accessToken,
        consumerKey: userData?.authType == 'woo' ? userData?.consumerKey  : "X",
        consumerSecret: userData?.authType == 'woo' ? userData?.consumerSecret  : "X",
        lastUpdated: userData?.lastLogin || userData?.createdAt,
        authType: userData?.authType,
        favicon: `https://www.google.com/s2/favicons?domain=${userData.storeUrl}&sz=64`,
        myShopifyUrl: userData?.myShopifyUrl,
        showProductImages: userData?.showProductImages ?? true,
        version: userData?.version || 'v2',
      };

      // Save to local storage for API client
      console.log("Save settings... ", settings);

      // ANY IDEA Y THIS NOT WORKS?
      settingsStorage.set(settings);

      return settings;
    }

    return null;
  } catch (error) {
    console.error("[settings.service] Failed to get user settings:", error);
    throw error;
  }
};

// Keep this as a no-op since we don't need to save settings separately anymore
export const saveUserSettings = async (
  userId: string,
  settings: UserSettings
): Promise<void> => {
  // Settings are now saved as part of the user document during auth
  settingsStorage.set(settings);
};
