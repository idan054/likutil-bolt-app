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
} from '../../types/delivery';
import { DeliveryProgramType } from '../../components/settings/tabs/sections/delivery/marketplace/AddDeliveryCompanyCard';

export const getKeysByProgramType = (integration: DeliveryIntegration, testData?: Record<string, string>) => {
  switch (integration.programType) {
    case DeliveryProgramType.BALDAR:
      // return testData ? `${testData.clientId}` : `${integration.clientId}`;
      return testData ? `${testData.username},${testData.password}` : `${integration.username},${integration.password}`;
    case DeliveryProgramType.RUN:
      return testData ? `${testData.username},${testData.password}` : `${integration.username},${integration.password}`;
    case DeliveryProgramType.LION_WHEEL:
      return testData ? `${testData.token}` : `${integration.token}`;
    default: 
      return '';
  }
};

export const useDeliveryIntegrations = () => {
  const [user] = useAuthState(auth);
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [savedData, setSavedData] = useState<
    Record<string, Record<string, string>>
  >({});

  const [activeIntegrations, setActiveIntegrations] = useState<DeliveryIntegration[]>([]);
  const [integrations, setIntegrations] = useState<DeliveryIntegration[]>([]);

  const loadDeliveryCompanies = useCallback(async () => {
    console.log('loadDeliveryCompanies()')
    try {
      const companiesSnapshot = await getDocs(collection(db, 'delivery_companies'));
      const companies: DeliveryIntegration[] = [];
      
      companiesSnapshot.forEach((doc) => {
        companies.push({ provider: doc.id, ...doc.data() } as DeliveryIntegration);
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

      
      
      // console.log('settings?.connections', settings?.connections)
      // console.log('companies.length', companies.length)
      
      if (settings?.connections && companies.length > 0) {

        const updatedIntegrations = companies.map(
          (integration) => ({
            ...integration,
            isConnected: settings.connections.some(
              (conn) => conn.provider === integration.provider && conn.isConnected
            ),
          })
        );

        

  
        setIntegrations(updatedIntegrations);  // All possible integrations
        setActiveIntegrations(settings.connections); // User connected include Token & info

        // Update saved data
        const newSavedData: Record<string, Record<string, string>> = {};
        settings.connections.forEach((conn) => {
          if (conn?.provider && conn.clientId) {
            newSavedData[conn.provider] = { clientId: conn.clientId };
          }
        });
        setSavedData(newSavedData);
      } else {

        console.log('companies')
      console.log(companies)
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
      const userId = user?.uid;
      if (!userId) {
        toast.error('משתמש לא מחובר');
        return;
      }

      let currentIntegrations = integrations;
      if (currentIntegrations.length === 0) {
        const companies = await loadDeliveryCompanies();
        currentIntegrations = companies;
      }

      const integration = currentIntegrations.find(i => i.provider === id);
      if (!integration) {
        toast.error('חברת המשלוחים לא נמצאה');
        return;
      }

      let connection: DeliveryIntegration;
      setIsLoading(true);

      // console.log('data')
      // console.log(data)
      // return

      try {
   
        switch (integration?.programType) {
          case DeliveryProgramType.UPS:
            connection = {
              provider: id,
              token: '',
              clientId: data.clientId,
              username: data.username,
              password: data.password,
              lastTested: new Date().toISOString(),

              isConnected: true,
              name: integration.name,
              description:  integration.description,
              logoUrl:   integration.logoUrl,
              programType: integration.programType,
              controlPanelLink: integration.controlPanelLink,
            };
            break
          case DeliveryProgramType.BALDAR:
            connection = {
              provider: id,
              token: '',
              clientId: '',
              username: data.username,
              password: data.password,
              lastTested: new Date().toISOString(),

              isConnected: true,
              name: integration.name,
              description:  integration.description,
              logoUrl:   integration.logoUrl,
              programType: integration.programType,
              controlPanelLink: integration.controlPanelLink,
            };
            break
          case DeliveryProgramType.RUN:
            connection = {
              provider: id,
              token: '',
              clientId: '',
              username: data.username,
              password: data.password,
              lastTested: new Date().toISOString(),
              
              isConnected: true,
              name: integration.name,
              description:  integration.description,
              logoUrl:   integration.logoUrl,
              programType: integration.programType,
              controlPanelLink: integration.controlPanelLink,
            };
            break
          case DeliveryProgramType.LION_WHEEL:
            connection = {
              provider: id,
              token: data.token,
              clientId: undefined,
              username: undefined,
              password: undefined,
              lastTested: new Date().toISOString(),
              
              isConnected: true,
              name: integration.name,
              description:  integration.description,
              logoUrl:   integration.logoUrl,
              programType: integration.programType,
              controlPanelLink: integration.controlPanelLink,
            };
            break

          default:
            connection = {
              provider: integration.provider,
              clientId: undefined,
              token: undefined,
              username: undefined,
              password: undefined,
              lastTested: new Date().toISOString(),

              isConnected: false,
              name: integration.name,
              description:  integration.description,
              logoUrl:   integration.logoUrl,
              programType: integration.programType,
              controlPanelLink: integration.controlPanelLink,
            };
        }

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
    async (integration: DeliveryIntegration, data: Record<string, string>): Promise<boolean> => {
      if (!data) {
        toast.error('נא להזין מפתח התחברות');
        return false;
      }

      const userId = user?.uid;

      setIsTesting(true);
      try {
        const result = await testDeliveryConnection(integration.provider, getKeysByProgramType(integration, data),userId ??'');

        if (result.success) {
          toast.success('בדיקת החיבור הצליחה, רק וודאו שנפתחה הזמנת בדיקה בחברת המשלוחים (:');
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
    activeIntegrations,
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
