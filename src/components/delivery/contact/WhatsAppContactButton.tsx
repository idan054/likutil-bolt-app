import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';
import { WhatsAppIcon } from '../../icons/WhatsAppIcon';

export const WhatsAppContactButton: React.FC = () => {
  const { settings } = useSettings();
  const storeUrl = settings?.storeUrl || '';

  const handleContact = () => {
    const message = encodeURIComponent(
      `שלום, אשמח להוסיף חברת משלוחים לחנות שלי:\n` +
      `כתובת החנות: ${storeUrl}\n\n` +
      `אשמח לקבל פרטים על חיבור חברת משלוחים.`
    );
    
    window.open(`https://wa.me/972557113987?text=${message}`, '_blank');
  };

  return (
    <button
      onClick={handleContact}
      className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto mt-4"
    >
      <WhatsAppIcon size={20} />
      <span>ווטסאפ לחיבור סופר מהיר</span>
    </button>
  );
};