import { toast } from 'react-hot-toast';
import type { UserSettings } from '../../types/settings';

const STORAGE_KEY = 'wc_settings';
const SETTINGS_VERSION = 'v1'; // Add versioning for future migrations

class SettingsStorage {
  private static instance: SettingsStorage;
  private listeners: Set<() => void> = new Set();
  private retryAttempts: number = 0;
  private maxRetries: number = 3;

  private constructor() {
    // Listen for storage events from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        this.notifyListeners();
      }
    });

    // Periodic validation
    setInterval(() => this.validateSettings(), 30000);
  }

  static getInstance(): SettingsStorage {
    if (!SettingsStorage.instance) {
      SettingsStorage.instance = new SettingsStorage();
    }
    return SettingsStorage.instance;
  }

  get(): UserSettings | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Validate required fields
      if (!this.validateSettingsData(data)) {
        console.warn('[settings.storage] Invalid settings data found');
        return null;
      }

      return data;
    } catch (error) {
      console.error('[settings.storage] Failed to get settings:', error);
      return null;
    }
  }

  set(settings: UserSettings): void {
    try {
      if (!this.validateSettingsData(settings)) {
        throw new Error('Invalid settings data');
      }

      const data = {
        ...settings,
        version: SETTINGS_VERSION,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.retryAttempts = 0; // Reset retry counter on successful save
      this.notifyListeners();
    } catch (error) {
      console.error('[settings.storage] Failed to save settings:', error);
      this.handleStorageError();
    }
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
  }

  addListener(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  isAvailable(): boolean {
    return this.get() !== null;
  }

  private validateSettingsData(settings: any): boolean {
    if (!settings) return false;

    return (
      typeof settings.storeUrl === 'string' &&
      settings.storeUrl.trim().length > 0 &&
      (settings.consumerKey === undefined || 
        (typeof settings.consumerKey === 'string' && settings.consumerKey.trim().length > 0)) &&
      (settings.consumerSecret === undefined || 
        (typeof settings.consumerSecret === 'string' && settings.consumerSecret.trim().length > 0))
    );
  }

  private validateSettings(): void {
    const settings = this.get();
    if (!settings && this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      console.warn(`[settings.storage] Settings validation failed. Attempt ${this.retryAttempts} of ${this.maxRetries}`);
      this.handleStorageError();
    }
  }

  private handleStorageError(): void {
    if (this.retryAttempts >= this.maxRetries) {
      toast.error('שגיאה בהגדרות המערכת. אנא התחבר מחדש.', {
        id: 'settings-error',
        duration: 5000
      });
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const settingsStorage = SettingsStorage.getInstance();