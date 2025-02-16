export interface UserSettings {
  favicon: string | undefined;
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  lastUpdated?: string;
}

// Remove EncryptedSettings since we don't need it anymore
export interface SettingsFormData {
  favicon: string | undefined;
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}