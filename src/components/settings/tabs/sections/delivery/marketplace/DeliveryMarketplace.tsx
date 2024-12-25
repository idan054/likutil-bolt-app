import React from 'react';
import { IntegrationCard } from './IntegrationCard';
import { AddCompanyCard } from './AddCompanyCard';
import { IntegrationDetails } from './IntegrationDetails';
import type { DeliveryIntegration } from '../../../../../../types/delivery';

interface DeliveryMarketplaceProps {
  integrations: DeliveryIntegration[];
  activeIntegration: string | null;
  onSelect: (id: string | null) => void;
  savedData: Record<string, Record<string, string>>;
}

export const DeliveryMarketplace: React.FC<DeliveryMarketplaceProps> = ({
  integrations,
  activeIntegration,
  onSelect,
  savedData
}) => {
  const activeIntegrationDetails = activeIntegration 
    ? integrations.find(i => i.id === activeIntegration)
    : undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map(integration => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            isActive={activeIntegration === integration.id}
            onClick={() => onSelect(integration.id)}
          />
        ))}
        <AddCompanyCard />
      </div>

      {activeIntegration && activeIntegrationDetails && (
        <IntegrationDetails
          integration={activeIntegrationDetails}
          onClose={() => onSelect(null)}
          savedData={savedData}
        />
      )}
    </div>
  );
};