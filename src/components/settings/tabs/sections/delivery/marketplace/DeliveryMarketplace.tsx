import React, { useState } from 'react';
import { IntegrationCard } from './IntegrationCard';
import { RequestCompanyCard } from './RequestCompanyCard';
import { AddDeliveryCompanyCard } from './AddDeliveryCompanyCard';
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
  const [editingIntegration, setEditingIntegration] = useState<DeliveryIntegration | null>(null);
  
  const activeIntegrationDetails = activeIntegration 
    ? integrations.find(i => i.id === activeIntegration)
    : undefined;

  const handleEdit = (integration: DeliveryIntegration) => {
    setEditingIntegration(integration);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map(integration => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            isActive={activeIntegration === integration.id}
            onClick={() => onSelect(integration.id)}
            onEdit={handleEdit}
          />
        ))}
 
        <RequestCompanyCard />
      </div>

      {(!process.env.NODE_ENV || process.env.NODE_ENV === 'development') && (
          <AddDeliveryCompanyCard
            editingIntegration={editingIntegration}
            onSubmit={() => setEditingIntegration(null)}
          />
        )}

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