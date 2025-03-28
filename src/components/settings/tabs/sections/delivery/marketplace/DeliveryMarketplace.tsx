import React, { useState } from 'react';
import { IntegrationCard } from './IntegrationCard';
import { RequestCompanyCard } from './RequestCompanyCard';
import { AddDeliveryCompanyCard } from './AddDeliveryCompanyCard';
// import { IntegrationDetails } from './IntegrationDetails';
import type { DeliveryIntegration } from '../../../../../../types/delivery';
import { NonConnectedCompany } from '../../../../../delivery/company/NonConnectedCompany';

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
    ? integrations.find(i => i.provider === activeIntegration)
    : undefined;

  const handleEdit = (integration: DeliveryIntegration) => {
    setEditingIntegration(integration);
  };

  // console.log('activeIntegration', activeIntegration)
  // console.log('activeIntegrationDetails', activeIntegrationDetails)

  return (
    <div className="space-y-6" id="integration-popup">



      {activeIntegration && activeIntegrationDetails && (
        <div
          className="transition-all duration-300 ease-in-out transform"
          style={{
            animation: 'fadeInScale 0.3s ease-out'
          }}
        >
  

      {/* <button
          onClick={() => onSelect(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button> */}

        <NonConnectedCompany integration={activeIntegrationDetails} />


        </div>
      )}

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="integration-grid">
      

        {[...integrations]
          .sort((a, b) => (a.index || 0) - (b.index || 0))
          .map(integration => (
            <IntegrationCard
              key={integration.provider}
              integration={integration}
              isActive={activeIntegration === integration.provider}
              onClick={() => {
                document.getElementById('integration-popup')?.scrollIntoView({ behavior: 'smooth' });
                onSelect(integration.provider);
              }}
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
    </div>
  );
};