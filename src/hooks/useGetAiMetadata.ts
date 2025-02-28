import { useState, useEffect } from 'react';
import { apiClient } from '../services/api/client';
import { OrderStatus } from '../types/order';
import { BASE_URL } from '../services/auth/woo-auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { toast } from 'react-hot-toast';
import { useGetFirebaseMetadata } from './useGetFirebaseMetadata';

export interface MetadataOption {
  index: number;
  key: string;
  value: string;
  parent?: string;
  extra?: string;
  original_path?: {
    parent_path: string;
    label_path: string;
    value_path: string;
    extra_path: string;
  };
}

interface UseGetAiMetadataReturn {
  options: MetadataOption[]; // Get results From The AI And show to the user
  isLoading: boolean;
  error: string | null;
  selectedOptions: number[];
  showResults: boolean;
  fetchMetadataOptions: () => Promise<void>;
  handleOptionSelect: (optionId: number) => void;
  handleSubmitSelection: () => void;
  setShowResults: (show: boolean) => void;
}

export const useGetAiMetadata = (meta_data: Array<any>): UseGetAiMetadataReturn => {
  const [options, setOptions] = useState<MetadataOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const fetchMetadataOptions = async () => {
    setSelectedOptions([]);
    setOptions([]);
    setIsLoading(true);
    setError(null);


    try {
      console.log(meta_data)
    
      const response = await fetch(`${BASE_URL}/api/ai-get-clean-metadata`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({meta_data : meta_data})
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }

      const data: MetadataOption[] =    await response.json();


      setOptions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metadata options';
      setError(errorMessage);
      console.error('Error fetching AI metadata:', err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleOptionSelect = (optionId: number) => {
    setSelectedOptions(prev => 
      prev.includes(optionId)
        ? prev.filter(index => index !== optionId)
        : [...prev, optionId]
    );
  };

  const {saveFbOptions} = useGetFirebaseMetadata();
  const handleSubmitSelection = () => {


    const selectedItems = options.filter(option => 
      selectedOptions.includes(option.index)
    );
    console.log('Selected items:', selectedItems);

    if (selectedItems.length > 0) {
      saveFbOptions(selectedItems);
    }
    
    setSelectedOptions([]);
  };



  return {
    options,
    isLoading,
    error,
    selectedOptions,
    showResults,
    fetchMetadataOptions,
    handleOptionSelect,
    handleSubmitSelection,
    setShowResults,
  };

};