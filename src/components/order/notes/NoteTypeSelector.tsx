import React from 'react';
import { MessageSquare, Mail } from 'lucide-react';
import { translations } from '../../../config/translations';

interface NoteTypeSelectorProps {
  isCustomerNote: boolean;
  onChange: (isCustomerNote: boolean) => void;
}

export const NoteTypeSelector: React.FC<NoteTypeSelectorProps> = ({
  isCustomerNote,
  onChange,
}) => {
  return (
    <div className="flex justify-end gap-2 mb-3">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
          !isCustomerNote
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <MessageSquare size={16} />
        <span>{translations.orderNotes.types.private}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
          isCustomerNote
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Mail size={16} />
        <span>{translations.orderNotes.types.customer}</span>
      </button>
    </div>
  );
};