import React from 'react';
import { StickyNote } from 'lucide-react';
import { translations } from '../../config/translations';

interface CustomerNoteProps {
  note?: string;
}

export const CustomerNote: React.FC<CustomerNoteProps> = ({ note }) => {
  if (!note) return null;

  return (
    <div className="bg-yellow-50 rounded-lg p-6 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <StickyNote size={24} className="text-yellow-600" />
        <h3 className="text-xl font-semibold">{translations.customerNote}</h3>
      </div>
      <div className="text-lg text-yellow-800">
        {note}
      </div>
    </div>
  );
};