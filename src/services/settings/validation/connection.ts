import type { UserSettings } from '../../../types/settings';

export const validateSettingsConnection = async (settings: UserSettings): Promise<boolean> => {
  if (!settings.storeUrl || !settings.consumerKey || !settings.consumerSecret) {
    return false;
  }

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