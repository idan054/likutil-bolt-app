import React from 'react';
import { MessageSquare, Mail } from 'lucide-react';
import { WhatsAppIcon } from '../../icons/WhatsAppIcon';
import { translations } from '../../../config/translations';

export const noteTypeColors = {
  private: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    hover: 'hover:bg-blue-200',
    button: 'bg-blue-600 hover:bg-blue-700'
  },
  customer: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    hover: 'hover:bg-red-200',
    button: 'bg-red-600 hover:bg-red-700'
  },
  whatsapp: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    hover: 'hover:bg-green-200',
    button: 'bg-green-600 hover:bg-green-700'
  }
};

interface NoteTypeSelectorProps {
  isCustomerNote: boolean;
  isWhatsAppNote: boolean;
  onChange: (type: 'private' | 'customer' | 'whatsapp') => void;
}

export const NoteTypeSelector: React.FC<NoteTypeSelectorProps> = ({
  isCustomerNote,
  isWhatsAppNote,
  onChange,
}) => {
  return (
    <div className="flex justify-end gap-2 mb-3">
      <button
        type="button"
        onClick={() => onChange('private')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
          !isCustomerNote && !isWhatsAppNote
            ? `${noteTypeColors.private.bg} ${noteTypeColors.private.text}`
            : `bg-gray-100 text-gray-600 hover:bg-gray-200`
        }`}
      >
        <MessageSquare size={16} />
        <span>{translations.orderNotes.types.private}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('customer')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
          isCustomerNote && !isWhatsAppNote
            ? `${noteTypeColors.customer.bg} ${noteTypeColors.customer.text}`
            : `bg-gray-100 text-gray-600 hover:bg-gray-200`
        }`}
      >
        <Mail size={16} />
        <span>מייל ללקוח</span>
      </button>
      
      <button
        type="button"
        onClick={() => onChange('whatsapp')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
          isWhatsAppNote
            ? `${noteTypeColors.whatsapp.bg} ${noteTypeColors.whatsapp.text}`
            : `bg-gray-100 text-gray-600 hover:bg-gray-200`
        }`}
      >
        <WhatsAppIcon size={16} />
        <span>הודעת ווטסאפ</span>
      </button>

    </div>
  );
};