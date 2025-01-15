import type { UserSettings } from '../../../types/settings';

export const validateSettingsFormat = (settings: unknown): settings is UserSettings => {
  if (!settings || typeof settings !== 'object') return false;
  
  const { storeUrl, consumerKey, consumerSecret } = settings as Record<string, unknown>;
  
  return (
    typeof storeUrl === 'string' && storeUrl.trim().length > 0 &&
    typeof consumerKey === 'string' && consumerKey.trim().length > 0 &&
    typeof consumerSecret === 'string' && consumerSecret.trim().length > 0
  );
};