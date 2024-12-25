import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

interface ContactInfoProps {
  email?: string;
  phone?: string;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ email, phone }) => {
  const hasEmail = email && email.trim().length > 0;

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
            href={`https://wa.me/${formatPhoneForWhatsapp(phone)}`}
            target="_blank"
            rel="noopener noreferrer"
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

const formatPhoneForWhatsapp = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('0') ? '972' + digits.slice(1) : digits;
};
