import { useState, useEffect } from 'react';
import type { UserSettings } from '../../types/settings';

export const useSettingsStorage = () => {
  const [settings, setSettings] = useState<UserSettings | null>(() => {
    try {
      const stored = localStorage.getItem('wc_settings');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (settings) {
      localStorage.setItem('wc_settings', JSON.stringify(settings));
      window.dispatchEvent(new Event('settings_updated'));
    } else {
      localStorage.removeItem('wc_settings');
    }
  }, [settings]);

  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
  };

  const clearSettings = () => {
    setSettings(null);
  };

  return {
    settings,
    updateSettings,
    clearSettings,
  };
};