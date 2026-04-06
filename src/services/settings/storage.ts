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
      if (!settings) return;

      if (!this.validateSettingsData(settings)) {
        console.error('[settings.storage] Invalid settings data:', settings);
        // Don't throw, just log and return to avoid breaking callers that might loop
        return;
      }

      const data = {
        ...settings,
        version: settings.version || SETTINGS_VERSION,
        lastUpdated: settings.lastUpdated || new Date().toISOString()
      };

      const stringified = JSON.stringify(data);
      const current = localStorage.getItem(STORAGE_KEY);
      
      // Only update and notify if data actually changed
      if (stringified !== current) {
        localStorage.setItem(STORAGE_KEY, stringified);
        this.retryAttempts = 0;
        this.notifyListeners();
      }
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

    // We only require storeUrl for basic operation
    // consumerKey/Secret are optional depending on authType
    return (
      typeof settings.storeUrl === 'string' &&
      settings.storeUrl.trim().length > 0
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