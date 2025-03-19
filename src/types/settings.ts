export interface UserSettings {
  favicon: string | undefined;
  storeUrl: string;
  accessToken: string | undefined;
  consumerKey: string | undefined;
  consumerSecret: string | undefined;
  lastUpdated?: string;
}

// Remove EncryptedSettings since we don't need it anymore
export interface SettingsFormData {
  favicon: string | undefined;
  storeUrl: string;
  accessToken: string | undefined;
  consumerKey: string | undefined;
  consumerSecret: string | undefined;
}