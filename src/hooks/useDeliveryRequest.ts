import { useState, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { USE_DEBUG_AUTH, DEBUG_USER } from '../config/constants';
import { sendDeliveryRequest } from '../services/delivery/request/api';
import { saveUserPhone, getUserPhone } from '../services/delivery/request/storage';
import { getUserData } from '../services/user/user.service';
import { useDeliveryIntegrations } from './settings/useDeliveryIntegrations';
import { settingsStorage } from '../services/settings/storage';
import type { DeliveryIntegration } from '../types/delivery';

export const useDeliveryRequest = () => {
  const [user] = useAuthState(auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { integrations } = useDeliveryIntegrations();

  const loadSavedPhone = useCallback(async () => {
    const userId = USE_DEBUG_AUTH ? DEBUG_USER.uid : user?.uid;
    if (!userId) return null;

    try {
      return await getUserPhone(userId);
    } catch (error) {
      console.error('[useDeliveryRequest] Failed to load saved phone:', error);
      return null;
    }
  }, [user?.uid]);

  const submitRequest = useCallback(async (integration: DeliveryIntegration, phone: string) => {
    const userId = USE_DEBUG_AUTH ? DEBUG_USER.uid : user?.uid;
    if (!userId) return;

    setIsSubmitting(true);
    try {
      // Save phone number
      await saveUserPhone(userId, phone);

      // Get user data
      const userData = await getUserData(userId);
      const settings = settingsStorage.get();
      
      // Get connected providers
      const connectedProviders = integrations
        .filter(i => i.isConnected)
        .map(i => i.name);

      // Send email
      await sendDeliveryRequest(integration, phone, {
        createdAt: userData?.createdAt,
        connectedProviders,
        storeUrl: settings?.storeUrl
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.uid, integrations]);

  return {
    isSubmitting,
    loadSavedPhone,
    submitRequest
  };
};