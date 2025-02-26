import { useState } from 'react';

interface MetadataOption {
  id: number;
  name: string;
  description: string;
}

interface UseGetAiMetadataReturn {
  options: MetadataOption[];
  isLoading: boolean;
  error: string | null;
  selectedOptions: number[];
  showResults: boolean;
  fetchMetadataOptions: () => Promise<void>;
  handleOptionSelect: (optionId: number) => void;
  handleSubmitSelection: () => void;
  setShowResults: (show: boolean) => void;
}

export const useGetAiMetadata = (productId: string | number): UseGetAiMetadataReturn => {
  const [options, setOptions] = useState<MetadataOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const fetchMetadataOptions = async () => {
    setIsLoading(true);
    setError(null);

    try {
    //   const response = await fetch(`/api/ai/metadata/${productId}`, {
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //   });

    //   if (!response.ok) {
    //     throw new Error(`HTTP error! status: ${response.status}`);
    //   }

    //   const data = await response.json();

    const data = [
        { id: 1, name: 'שדות מוצר מותאמים אישית', description: 'מפרט מוצר נוסף' },
        { id: 2, name: 'פרטי מלאי', description: 'מידע מורחב על המלאי' },
        { id: 3, name: 'מאפייני משלוח', description: 'כללי משלוח ספציפיים למוצר' }
      ];

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
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSubmitSelection = () => {
    const selectedItems = options.filter(option => 
      selectedOptions.includes(option.id)
    );
    console.log('Selected items:', selectedItems);
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
    setShowResults
  };

};