export type Platform = "woo" | "shopify";

export interface UserSettings {
  favicon: string | undefined;
  storeUrl: string;
  myShopifyUrl?: string;
  businessPhone: string | undefined;
  accessToken: string | undefined;
  consumerKey: string | undefined;
  consumerSecret: string | undefined;
  lastUpdated?: string;
  authType?: Platform;
  shopifyToken?: string;
}

// Remove EncryptedSettings since we don't need it anymore
export interface SettingsFormData {
  favicon: string | undefined;
  storeUrl: string;
  myShopifyUrl?: string;
  accessToken: string | undefined;
  consumerKey: string | undefined;
  consumerSecret: string | undefined;
}
