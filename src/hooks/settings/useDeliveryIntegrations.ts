import { useState, useCallback, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'react-hot-toast';
import { auth, db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { testDeliveryConnection } from '../../services/delivery/api/test';
import {
  saveDeliverySettings,
  getDeliverySettings,
  removeDeliveryConnection,
} from '../../services/delivery/storage/firebase';
import { showErrorToast } from '../../utils/error';
import type {
  DeliveryIntegration,
  DeliveryConnection,
} from '../../types/delivery';

export const useDeliveryIntegrations = () => {
  const [user] = useAuthState(auth);
  const [activeIntegration, setActiveIntegration] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [savedData, setSavedData] = useState<
    Record<string, Record<string, string>>
  >({});
  const [integrations, setIntegrations] = useState<DeliveryIntegration[]>([]);

  const loadDeliveryCompanies = useCallback(async () => {
    try {
      const companiesSnapshot = await getDocs(collection(db, 'delivery_companies'));
      const companies: DeliveryIntegration[] = [];
      
      companiesSnapshot.forEach((doc) => {
        companies.push({ id: doc.id, ...doc.data() } as DeliveryIntegration);
      });

      return companies;
    } catch (error) {
      console.error('[useDeliveryIntegrations] Failed to load companies:', error);
      showErrorToast(error);
      return [];
    }
  }, []);

  const loadSettings = useCallback(async () => {
    const userId = user?.uid;
    if (!userId) return;

    try {
      setIsLoading(true);
      const settings = await getDeliverySettings(userId);
      const companies = await loadDeliveryCompanies();

      if (settings?.connections && companies.length > 0) {
        // Update integrations status
        const updatedIntegrations = companies.map(
          (integration) => ({
            ...integration,
            isConnected: settings.connections.some(
              (conn) => conn.provider === integration.id && conn.isConnected
            ),
          })
        );
        setIntegrations(updatedIntegrations);

        // Update saved data
        const newSavedData: Record<string, Record<string, string>> = {};
        settings.connections.forEach((conn) => {
          if (conn?.provider) {
            newSavedData[conn.provider] = { key: conn.key };
          }
        });
        setSavedData(newSavedData);
      } else {
        setIntegrations(companies);
      }
    } catch (error) {
      console.error(
        '[useDeliveryIntegrations] Failed to load settings:',
        error
      );
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadDeliveryCompanies]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveIntegration = useCallback(
    async (id: string, data: Record<string, string>) => {
      const userId =  user?.uid;
      if (!userId) {
        toast.error('משתמש לא מחובר');
        return;
      }

      setIsLoading(true);
      try {
        const connection: DeliveryConnection = {
          provider: id,
          key: data.key,
          lastTested: new Date().toISOString(),
          isConnected: true,
        };

        await saveDeliverySettings(userId, connection);
        setSavedData((prev) => ({ ...prev, [id]: data }));
        await loadSettings();

        toast.success('החיבור נשמר בהצלחה');
        setActiveIntegration(null);
      } catch (error) {
        console.error(
          '[useDeliveryIntegrations] Failed to save integration:',
          error
        );
        showErrorToast(error);
      } finally {
        setIsLoading(false);
      }
    },
    [user, loadSettings]
  );

  const removeIntegration = useCallback(
    async (id: string) => {
      const userId =  user?.uid;
      if (!userId) {
        toast.error('משתמש לא מחובר');
        return;
      }

      setIsRemoving(true);
      try {
        await removeDeliveryConnection(userId, id);
        setSavedData((prev) => {
          const newData = { ...prev };
          delete newData[id];
          return newData;
        });
        await loadSettings();

        toast.success('החיבור הוסר בהצלחה');
        setActiveIntegration(null);
      } catch (error) {
        console.error(
          '[useDeliveryIntegrations] Failed to remove integration:',
          error
        );
        showErrorToast(error);
      } finally {
        setIsRemoving(false);
      }
    },
    [user, loadSettings]
  );

  const testIntegration = useCallback(
    async (id: string, key: string): Promise<boolean> => {
      if (!key) {
        toast.error('נא להזין מפתח התחברות');
        return false;
      }

      setIsTesting(true);
      try {
        const result = await testDeliveryConnection(id, key);

        if (result.success) {
          toast.success('בדיקת החיבור הצליחה, מומלץ לוודא שנפתחה הזמנת בדיקה במערכת חברת השליחויות');
          return true;
        }

        toast.error(result.errorMessage || 'בדיקת החיבור נכשלה');
        return false;
      } catch (error) {
        console.error(
          '[useDeliveryIntegrations] Failed to test integration:',
          error
        );
        showErrorToast(error);
        return false;
      } finally {
        setIsTesting(false);
      }
    },
    []
  );

  return {
    integrations,
    activeIntegration,
    setActiveIntegration,
    saveIntegration,
    removeIntegration,
    testIntegration,
    isLoading,
    isTesting,
    isRemoving,
    savedData,
  };
};
