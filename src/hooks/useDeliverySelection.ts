import { useState, useEffect } from 'react';
import type { DeliveryProvider } from '../components/delivery/DeliverySelector';

interface UseDeliverySelectionProps {
  connectedProviders: Set<string>;
}

export const useDeliverySelection = ({ connectedProviders }: UseDeliverySelectionProps) => {
  const [selectedProvider, setSelectedProvider] = useState<DeliveryProvider | null>(null);

  // Auto-select if only one provider is connected
  useEffect(() => {
    if (!selectedProvider && connectedProviders.size === 1) {
      const [provider] = connectedProviders;
      setSelectedProvider(provider as DeliveryProvider);
    }
  }, [selectedProvider, connectedProviders]);

  return {
    selectedProvider,
    setSelectedProvider
  };
};