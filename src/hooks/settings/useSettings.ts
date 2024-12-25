import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';
import { getUserSettings, saveUserSettings } from '../../services/settings/settings.service';
import { useDebugAuth } from '../useDebugAuth';
import { toast } from 'react-hot-toast';
import type { UserSettings } from '../../types/settings';

export const useSettings = () => {
  const [user] = useAuthState(auth);
  const { isEnabled: isDebugMode, mockUser } = useDebugAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const userId = isDebugMode ? mockUser.uid : user?.uid;
      if (!userId) return;

      try {
        const userSettings = await getUserSettings(userId);
        setSettings(userSettings);
        
        // Store settings in localStorage for API client
        if (userSettings) {
          localStorage.setItem('wc_settings', JSON.stringify(userSettings));
        } else {
          localStorage.removeItem('wc_settings');
        }
      } catch (error) {
        console.error('[useSettings] Failed to fetch settings:', error);
        localStorage.removeItem('wc_settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();

    // Cleanup on unmount
    return () => {
      localStorage.removeItem('wc_settings');
    };
  }, [user?.uid, isDebugMode, mockUser.uid]);

  const updateSettings = async (newSettings: UserSettings): Promise<boolean> => {
    const userId = isDebugMode ? mockUser.uid : user?.uid;
    if (!userId) return false;

    try {
      await saveUserSettings(userId, newSettings);
      setSettings(newSettings);
      localStorage.setItem('wc_settings', JSON.stringify(newSettings));
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
  };
};