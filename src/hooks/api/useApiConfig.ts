import { useState, useEffect } from 'react';
import { getApiConfig } from '../../services/api/config';
import type { ApiConfig } from '../../services/api/types';

export const useApiConfig = () => {
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = () => {
      const apiConfig = getApiConfig();
      setConfig(apiConfig);
      setIsLoading(false);
    };

    // Initial load
    loadConfig();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wc_settings') {
        loadConfig();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { config, isLoading };
};