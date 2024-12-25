import React from 'react';
import { DeliveryMarketplace } from './marketplace/DeliveryMarketplace';
import { useDeliveryIntegrations } from '../../../../../hooks/settings/useDeliveryIntegrations';

export const DeliverySettings: React.FC = () => {
  const { 
    integrations,
    activeIntegration,
    setActiveIntegration,
    saveIntegration,
    removeIntegration,
    testIntegration,
    isLoading,
    isTesting,
    isRemoving,
    savedData
  } = useDeliveryIntegrations();

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold">חיבור לחברות משלוחים</h2>
        <p className="text-gray-600 mt-1">
          חבר את החנות שלך לחברות המשלוחים המובילות בישראל
        </p>
      </div>

      <DeliveryMarketplace
        integrations={integrations}
        activeIntegration={activeIntegration}
        onSelect={setActiveIntegration}
        onSave={saveIntegration}
        onRemove={removeIntegration}
        onTest={testIntegration}
        isLoading={isLoading}
        isTesting={isTesting}
        isRemoving={isRemoving}
        savedData={savedData}
      />
    </div>
  );
};