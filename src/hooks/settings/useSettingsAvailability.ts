import { useState, useEffect } from 'react';
import { validateSettings } from '../../services/api/config/settings';

export const useSettingsAvailability = () => {
  const [hasSettings, setHasSettings] = useState(false);

  useEffect(() => {
    const checkSettings = () => {
      try {
        const settingsStr = localStorage.getItem('wc_settings');
        if (!settingsStr) {
          setHasSettings(false);
          return;
        }

        const settings = JSON.parse(settingsStr);
        setHasSettings(validateSettings(settings));
      } catch {
        setHasSettings(false);
      }
    };

    checkSettings();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wc_settings') {
        checkSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { hasSettings };
};