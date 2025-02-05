import type { UserSettings } from '../../types/settings';

export const validateSettingsFormat = (settings: unknown): settings is UserSettings => {
  if (!settings || typeof settings !== 'object') return false;
  
  const { storeUrl, consumerKey, consumerSecret } = settings as Record<string, unknown>;
  return (
    typeof storeUrl === 'string' && storeUrl.trim().length > 0 &&
    typeof consumerKey === 'string' && consumerKey.trim().length > 0 &&
    typeof consumerSecret === 'string' && consumerSecret.trim().length > 0
  );
};

export const validateSettingsConnection = async (settings: UserSettings): Promise<boolean> => {
  const domain = settings.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const baseUrl = `https://${domain}/wp-json/wc/v3`;
  const auth = btoa(`${settings.consumerKey}:${settings.consumerSecret}`);

  try {
    const response = await fetch(`${baseUrl}/orders?per_page=1`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch {
    return false;
  }
};