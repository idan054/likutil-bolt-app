import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../../config/firebase';
import { filterCompaniesByIds } from '../../utils/delivery/companies';
import type { DeliveryIntegration } from '../../types/delivery';

export const useDeliveryCompanies = () => {
  const [user] = useAuthState(auth);
  const [availableCompanies, setAvailableCompanies] = useState<DeliveryIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDeliveryCompanies = useCallback(async () => {
    try {
      const companiesSnapshot = await getDocs(collection(db, 'delivery_companies'));
      const companies: DeliveryIntegration[] = [];
      
      companiesSnapshot.forEach((doc) => {
        companies.push({ provider: doc.id, ...doc.data() } as DeliveryIntegration);
      });

      return companies;
    } catch (error) {
      console.error('[delivery.hooks] Failed to load companies:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    const fetchUserCompanies = async () => {
      try {
        const userId = user?.uid;
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

        const companies = await loadDeliveryCompanies();
        const filteredCompanies = filterCompaniesByIds(
          companies,
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
  }, [user, loadDeliveryCompanies]);

  return {
    companies: availableCompanies,
    isLoading
  };
};