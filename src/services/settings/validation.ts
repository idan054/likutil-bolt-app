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

export const validateSettings = (settings: Partial<UserSettings>): string[] => {
  const errors: string[] = [];

  if (!settings.storeUrl?.trim()) {
    errors.push('כתובת החנות נדרשת');
  }

  if (!settings.consumerKey?.trim()) {
    errors.push('מפתח צרכן נדרש');
  }

  if (!settings.consumerSecret?.trim()) {
    errors.push('סוד צרכן נדרש');
  }

  return errors;
};