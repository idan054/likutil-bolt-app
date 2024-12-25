import React, { useState } from 'react';
import { MessageSquarePlus, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { NotesList } from './NotesList';
import { NoteTypeSelector } from './NoteTypeSelector';
import { NoteInput } from './NoteInput';
import { useOrderNotes } from '../../../hooks/useOrderNotes';
import { translations } from '../../../config/translations';

interface OrderNotesProps {
  orderId: string;
}

export const OrderNotes: React.FC<OrderNotesProps> = ({ orderId }) => {
  const { notes, isLoading, addNote } = useOrderNotes(orderId);
  const [newNote, setNewNote] = useState('');
  const [isCustomerNote, setIsCustomerNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    try {
      await addNote({
        note: newNote.trim(),
        customer_note: isCustomerNote
      });
      setNewNote('');
      toast.success(translations.orderNotes.addSuccess);
    } catch (error) {
      toast.error(translations.orderNotes.addError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t pt-6">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="text-gray-600" size={24} />
          <h3 className="text-xl font-semibold">{translations.orderNotes.title}</h3>
        </div>
        <ChevronDown 
          className={`text-gray-600 transition-transform duration-200 ${
            isExpanded ? 'transform rotate-180' : ''
          }`} 
          size={24} 
        />
      </div>

      <div className={`transition-all duration-200 overflow-hidden ${
        isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="space-y-4">
          <div>
            <NoteTypeSelector 
              isCustomerNote={isCustomerNote}
              onChange={setIsCustomerNote}
            />
            
            <NoteInput
              value={newNote}
              onChange={setNewNote}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-1">
            <NotesList notes={notes} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};