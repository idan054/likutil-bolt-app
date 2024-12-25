import type { UserSettings } from '../../types/settings';

const STORAGE_KEY = 'wc_settings';

export const settingsStorage = {
  get: (): UserSettings | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  set: (settings: UserSettings): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      window.dispatchEvent(new Event('settings_updated'));
    } catch (error) {
      console.error('[settings.storage] Failed to save settings:', error);
    }
  },

  clear: (): void => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('settings_updated'));
  },

  isAvailable: (): boolean => {
    const settings = settingsStorage.get();
    return settings !== null;
  }
};