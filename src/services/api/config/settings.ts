import type { ApiConfig } from '../types';

export const validateSettings = (settings: unknown): settings is {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
} => {
  if (!settings || typeof settings !== 'object') return false;
  
  const { storeUrl, consumerKey, consumerSecret } = settings as Record<string, unknown>;
  return (
    typeof storeUrl === 'string' && storeUrl.length > 0 &&
    typeof consumerKey === 'string' && consumerKey.length > 0 &&
    typeof consumerSecret === 'string' && consumerSecret.length > 0
  );
};

export const getApiConfig = (): ApiConfig | null => {
  try {
    const settingsStr = localStorage.getItem('wc_settings');
    if (!settingsStr) return null;

    const settings = JSON.parse(settingsStr);
    if (!validateSettings(settings)) {
      console.warn('[api.config] Invalid settings format');
      return null;
    }

    const { storeUrl, consumerKey, consumerSecret } = settings;
    const domain = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const baseUrl = `https://${domain}/wp-json/wc/v3`;
    const auth = btoa(`${consumerKey}:${consumerSecret}`);

    return {
      baseUrl,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
  } catch (error) {
    console.error('[api.config] Failed to parse settings:', error);
    return null;
  }
};