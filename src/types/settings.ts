export interface UserSettings {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  lastUpdated?: string;
}

// Remove EncryptedSettings since we don't need it anymore
export interface SettingsFormData {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}