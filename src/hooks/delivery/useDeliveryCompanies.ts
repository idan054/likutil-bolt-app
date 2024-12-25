import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../../config/firebase';
import { DELIVERY_INTEGRATIONS } from '../../config/delivery';
import { useDebugAuth } from '../useDebugAuth';
import { filterCompaniesByIds } from '../../utils/delivery/companies';
import type { DeliveryIntegration } from '../../types/delivery';

export const useDeliveryCompanies = () => {
  const [user] = useAuthState(auth);
  const { isEnabled: isDebugMode, mockUser } = useDebugAuth();
  const [availableCompanies, setAvailableCompanies] = useState<DeliveryIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserCompanies = async () => {
      try {
        const userId = isDebugMode ? mockUser.uid : user?.uid;
        if (!userId) {
          setAvailableCompanies([]);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data();
        
        if (!userData?.showOnlyCompanies) {
          setAvailableCompanies([]);
          return;
        }

        const filteredCompanies = filterCompaniesByIds(
          DELIVERY_INTEGRATIONS,
          userData.showOnlyCompanies
        );
        setAvailableCompanies(filteredCompanies);
      } catch (error) {
        console.error('[delivery.hooks] Failed to fetch user companies:', error);
        setAvailableCompanies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCompanies();
  }, [user, isDebugMode, mockUser]);

  return {
    companies: availableCompanies,
    isLoading
  };
};