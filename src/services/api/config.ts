import type { ApiConfig } from './types';

export const getApiConfig = (): ApiConfig | null => {
  const settingsStr = localStorage.getItem('wc_settings');
  if (!settingsStr) {
    return null;
  }

  const settings = JSON.parse(settingsStr);
  const { storeUrl, consumerKey, consumerSecret } = settings;

  if (!storeUrl || !consumerKey || !consumerSecret) {
    return null;
  }

  const domain = storeUrl.startsWith('www.') ? storeUrl : `www.${storeUrl}`;
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
};