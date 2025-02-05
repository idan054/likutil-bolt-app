import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../config/firebase';
import { DELIVERY_INTEGRATIONS } from '../config/delivery';
import { useDebugAuth } from './useDebugAuth';
import type { DeliveryIntegration } from '../types/delivery';

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
          setAvailableCompanies(DELIVERY_INTEGRATIONS);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data();
        
        if (userData?.showOnlyCompanies?.length > 0) {
          // Filter companies based on user's showOnlyCompanies list
          const filteredCompanies = DELIVERY_INTEGRATIONS.filter(
            company => userData.showOnlyCompanies.includes(company.id)
          );
          setAvailableCompanies(filteredCompanies);
        } else {
          // If no companies specified, show all
          setAvailableCompanies(DELIVERY_INTEGRATIONS);
        }
      } catch (error) {
        console.error('[useDeliveryCompanies] Failed to fetch user companies:', error);
        setAvailableCompanies(DELIVERY_INTEGRATIONS);
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