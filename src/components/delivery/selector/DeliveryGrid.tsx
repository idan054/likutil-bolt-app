import React from 'react';
import { DeliveryCard } from './DeliveryCard';
import { DELIVERY_INTEGRATIONS } from '../../../config/delivery';
import type { DeliveryProvider } from '../DeliverySelector';

interface DeliveryGridProps {
  selectedProvider: DeliveryProvider | null;
  onSelect: (provider: DeliveryProvider) => void;
  connectedProviders: Set<string>;
}

export const DeliveryGrid: React.FC<DeliveryGridProps> = ({
  selectedProvider,
  onSelect,
  connectedProviders,
}) => {
  // Sort integrations to show connected providers first
  const sortedIntegrations = [...DELIVERY_INTEGRATIONS].sort((a, b) => {
    const aConnected = connectedProviders.has(a.id);
    const bConnected = connectedProviders.has(b.id);
    if (aConnected && !bConnected) return -1;
    if (!aConnected && bConnected) return 1;
    return 0;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {sortedIntegrations.map((integration) => (
        <DeliveryCard
          key={integration.id}
          id={integration.id as DeliveryProvider}
          name={integration.name}
          description={integration.description}
          logoUrl={integration.logoUrl}
          isSelected={selectedProvider === integration.id}
          isConnected={connectedProviders.has(integration.id)}
          onClick={() => onSelect(integration.id as DeliveryProvider)}
        />
      ))}
    </div>
  );
};