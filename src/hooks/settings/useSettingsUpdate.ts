import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { updateUserSettings } from '../../services/settings/update.service';
import { validateSettings } from '../../services/settings/validation';
import type { UserSettings } from '../../types/settings';

export const useSettingsUpdate = (userId: string) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateSettings = async (settings: Partial<UserSettings>): Promise<boolean> => {
    const errors = validateSettings(settings);
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return false;
    }

    setIsUpdating(true);
    const toastId = 'settings-update';

    try {
      toast.loading('מעדכן הגדרות...', { id: toastId });
      await updateUserSettings(userId, settings);
      toast.success('ההגדרות עודכנו בהצלחה', { id: toastId });
      return true;
    } catch (error) {
      console.error('[useSettingsUpdate] Failed to update settings:', error);
      toast.error('שגיאה בעדכון ההגדרות', { id: toastId });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateSettings,
    isUpdating
  };
};