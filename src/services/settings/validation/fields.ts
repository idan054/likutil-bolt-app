import type { UserSettings } from '../../../types/settings';

export const validateSettingsFields = (settings: Partial<UserSettings>): string[] => {
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