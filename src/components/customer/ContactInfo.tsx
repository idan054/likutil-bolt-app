import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { formatPhoneForWhatsapp } from '../../utils/phone';

interface ContactInfoProps {
  email?: string;
  phone?: string;
  onWhatsAppClick?: () => void;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ 
  email, 
  phone,
  onWhatsAppClick
}) => {
  const hasEmail = email && email.trim().length > 0;

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onWhatsAppClick) {
      onWhatsAppClick();
    }
  };

  return (
    <div className="space-y-2 text-right">
      {hasEmail && (
        <div className="flex items-center gap-2">
          <a
            href={`mailto:${email}`}
            className="text-gray-700 hover:text-blue-600 flex-1"
          >
            {email}
          </a>
          <a
            href={`mailto:${email}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700"
            title="שלח אימייל"
          >
            <Mail size={20} />
          </a>
        </div>
      )}

      {phone && (
        <div className="flex items-center gap-2">
          <a
            href={`tel:${phone}`}
            className="text-gray-700 hover:text-blue-600 flex-1"
          >
            {phone}
          </a>
          <a
            href="#"
            onClick={handleWhatsAppClick}
            className="text-green-600 hover:text-green-700"
            title="צור קשר בוואטסאפ"
          >
            <MessageCircle size={20} />
          </a>
        </div>
      )}
    </div>
  );
};