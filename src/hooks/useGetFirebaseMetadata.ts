import { useState, useEffect } from 'react';
import { apiClient } from '../services/api/client';
import { OrderStatus } from '../types/order';
import { BASE_URL } from '../services/auth/woo-auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { toast } from 'react-hot-toast';
import { MetadataOption } from './useGetAiMetadata';



interface UseGetFirebaseMetadataReturn {
  isLoading: boolean;
  options: MetadataOption[]; 
  saveFbOptions: (options: MetadataOption[]) => Promise<void>;
  deleteFbOption: (option: MetadataOption) => Promise<void>;
}

export const useGetFirebaseMetadata = (): UseGetFirebaseMetadataReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [user] = useAuthState(auth);
  const [options, setOptions] = useState<MetadataOption[]>([]);

  useEffect(() => {
    const loadFbMetadata = async () => {
      if (!user) return;

      try {
        const docRef = doc(db, 'users', user.uid, 'settings', 'ai_metadata_paths');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setOptions(docSnap.data().options || []);
        }
      } catch (error) {
        console.error('[useGetAiMetadata] Failed to load path configs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFbMetadata();
  }, [user]);

  const saveFbOptions = async (newOptions: MetadataOption[]) => {
    if (!user) return;

    try {
      // Filter out duplicates from new options
      const uniqueNewOptions = newOptions.filter(newOption => 
        !options.some(existingConfig => 
          existingConfig.original_path?.parent_path === newOption.original_path?.parent_path &&
          existingConfig.original_path?.label_path === newOption.original_path?.label_path &&
          existingConfig.original_path?.value_path === newOption.original_path?.value_path
        )
      );

      if (uniqueNewOptions.length === 0) {
        toast.error('All path configurations already exist');
        return;
      }

      const updatedConfigs = [...uniqueNewOptions, ...options];
      
      const docRef = doc(db, 'users', user.uid, 'settings', 'ai_metadata_paths');
      await setDoc(docRef, { options: updatedConfigs });
      
      setOptions(updatedConfigs);
      toast.success(`${uniqueNewOptions.length} path configuration(s) saved successfully`);
    } catch (error) {
      console.error('[useGetAiMetadata] Failed to save path configs:', error);
      toast.error('Error saving path configurations');
    }
  };

  const deleteFbOption = async (optionToDelete: MetadataOption) => {
    if (!user) return;

    try {
      const updatedConfigs = options.filter(config => 
        config.original_path?.parent_path !== optionToDelete.original_path?.parent_path ||
        config.original_path?.label_path !== optionToDelete.original_path?.label_path ||
        config.original_path?.value_path !== optionToDelete.original_path?.value_path
      );
      
      const docRef = doc(db, 'users', user.uid, 'settings', 'ai_metadata_paths');
      await setDoc(docRef, { options: updatedConfigs });
      
      setOptions(updatedConfigs);
      toast.success('Path configuration deleted successfully');
    } catch (error) {
      console.error('[useGetAiMetadata] Failed to delete path config:', error);
      toast.error('Error deleting path configuration');
    }
  };

  return {
    isLoading,
    options,
    saveFbOptions: saveFbOptions,
    deleteFbOption: deleteFbOption
  };
};