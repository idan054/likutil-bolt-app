import React from 'react';
import { Globe, Phone } from 'lucide-react';

interface CompanyLinksProps {
  controlPanelLink?: string;
  supportPhone?: string;
}

export const CompanyLinks: React.FC<CompanyLinksProps> = ({
  controlPanelLink,
  supportPhone,
}) => (
  <div className="flex flex-wrap items-center gap-4">
    {controlPanelLink && (
      <a
        href={controlPanelLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
      >
        <Globe size={16} />
        <span>פאנל ניהול</span>
      </a>
    )}
    {supportPhone && (
      <a
        href={`tel:${supportPhone}`}
        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
      >
        <Phone size={16} />
        <span>{supportPhone}</span>
      </a>
    )}
  </div>
);