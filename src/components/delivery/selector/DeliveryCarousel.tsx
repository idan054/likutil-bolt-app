import React, { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { CompactDeliveryCard } from './CompactDeliveryCard';
import { RequestCompanyCard } from '../../settings/tabs/sections/delivery/marketplace/RequestCompanyCard';
import { WhatsAppContactButton } from '../contact/WhatsAppContactButton';
import { useDeliveryCompanies } from '../../../hooks/delivery/useDeliveryCompanies';
import { useHorizontalScroll } from '../../../hooks/ui/useHorizontalScroll';
import { sortCompaniesByConnection } from '../../../utils/delivery/companies';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { SettingsModal } from '../../settings/SettingsModal';
import { useSettings } from '../../../hooks/useSettings';
import { title } from 'framer-motion/client';

interface DeliveryCarouselProps {
  selectedProvider: string | null;
  onSelect: (provider: string) => void;
  connectedProviders: Set<string>;
}

export const DeliveryCarousel: React.FC<DeliveryCarouselProps> = ({
  selectedProvider,
  onSelect,
  connectedProviders,
}) => {
  const { scrollRef, scrollLeft, scrollRight } = useHorizontalScroll(240);
  const { companies, isLoading } = useDeliveryCompanies();
  const [showSettings, setShowSettings] = useState(false);
  const { settings } = useSettings();
  

  // Auto-select single company
  useEffect(() => {
    if (companies.length === 1 && !selectedProvider) {
      onSelect(companies[0].provider as string);
    }
  }, [companies, selectedProvider, onSelect]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex justify-center py-4">


          <RequestCompanyCard
          onClick={() => setShowSettings(true)}
            title="הוסף חברת שילוח "
            desc="חיבור מהיר לחברת השילוח שלך"
           />


        {showSettings && (
          <SettingsModal
            initialData={settings || undefined}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    );
  }

  // Don't show carousel if only one company
  if (companies.length === 1) {
    return null;
  }

  const sortedCompanies = sortCompaniesByConnection(companies, connectedProviders);

  return (
    <div className="relative group">
      {showSettings && (
        <SettingsModal
          initialData={settings || undefined}
          onClose={() => setShowSettings(false)}
        />
      )}
      <button 
        onClick={scrollLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-1 rounded-full shadow-md border opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={20} />
      </button>
      
      <button 
        onClick={scrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-1 rounded-full shadow-md border opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={20} />
      </button>

      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-none scroll-smooth px-1 py-2"
      >
        {sortedCompanies.map((integration) => (
          <CompactDeliveryCard
            key={integration.provider}
            id={integration.provider as string}
            name={integration.name}
            logoUrl={integration.logoUrl}
            isSelected={selectedProvider === integration.provider}
            isConnected={connectedProviders.has(integration.provider)}
            onClick={() => onSelect(integration.provider as string)}
          />
        ))}
      </div>

    </div>
  );
};