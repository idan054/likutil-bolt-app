import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { getUserSettings, saveUserSettings } from '../services/settings/settings.service';
import { settingsStorage } from '../services/settings/storage';
import { toast } from 'react-hot-toast';
import type { UserSettings } from '../types/settings';

export const useSettings = () => {
  const [user] = useAuthState(auth);
  const [settings, setSettings] = useState<UserSettings | null>(() => settingsStorage.get());
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const userId = user?.uid;
    if (!userId) return;

    try {
      const userSettings = await getUserSettings(userId);
      if (userSettings) {
        setSettings(userSettings);
        settingsStorage.set(userSettings);
      } else {
        settingsStorage.clear();
        setSettings(null);
      }
    } catch (error) {
      console.error('[useSettings] Failed to fetch settings:', error);
      toast.error('שגיאה בטעינת הגדרות');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchSettings();

    // Listen for settings changes
    const unsubscribe = settingsStorage.addListener(() => {
      setSettings(settingsStorage.get());
    });

    return () => unsubscribe();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: UserSettings): Promise<boolean> => {
    const userId = user?.uid;
    if (!userId) return false;

    try {
      await saveUserSettings(userId, newSettings);
      setSettings(newSettings);
      settingsStorage.set(newSettings);
      toast.success('ההגדרות נשמרו בהצלחה');
      return true;
    } catch (error) {
      console.error('[useSettings] Failed to update settings:', error);
      toast.error('שגיאה בשמירת ההגדרות');
      return false;
    }
  };

  return {
    settings,
    isLoading,
    updateSettings,
    refetchSettings: fetchSettings
  };
};