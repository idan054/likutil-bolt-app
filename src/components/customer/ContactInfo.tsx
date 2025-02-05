import React from 'react';
import { Mail } from 'lucide-react';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';

interface ContactInfoProps {
  email?: string;
  phone?: string;
  onExpandNotes?: () => void;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ 
  email, 
  phone,
  onExpandNotes
}) => {
  const hasEmail = email && email.trim().length > 0;

  const handleNotesExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onExpandNotes) {
      onExpandNotes();
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
            onClick={handleNotesExpand}
            className="text-green-600 hover:text-green-700"
            title="הערות להזמנה"
          >
            <WhatsAppIcon size={20} />
          </a>
        </div>
      )}
    </div>
  );
};