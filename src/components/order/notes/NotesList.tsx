import React from 'react';
import { MessageSquare, Mail, MessageCircle } from 'lucide-react';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { formatDate } from '../../../utils/date';
import { translations } from '../../../config/translations';
import type { OrderNote } from '../../../types/order';
import DOMPurify from 'dompurify';

interface NotesListProps {
  notes: OrderNote[];
  isLoading: boolean;
}

export const NotesList: React.FC<NotesListProps> = ({ notes, isLoading }) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (notes.length === 0) {
    return (
      <p className="text-gray-500 text-right">{translations.orderNotes.noNotes}</p>
    );
  }

  return (
    <div className="space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      {notes
        .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
        .map((note) => (
          <div 
            key={note.id} 
            className="p-4 rounded-lg bg-gray-50"
          >
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-gray-500">
              {formatDate(note.date_created)}
            </span>
            <div className="flex items-center gap-2">
              {note.customer_note ? (
                <>
                  <Mail size={16} className="text-red-700" />
                  <span className="-mr-1 text-sm text-gray-500">מייל</span>
                  {note.note?.includes('ההודעה נשלחה דרך Mail & WhatsApp') && (
                    <>
                      <MessageCircle size={16} className="text-green-600" />
                      <span className="-mr-1 text-sm text-gray-500">ווטסאפ</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <MessageSquare size={16} className="text-blue-600" />
                  <span className="text-sm text-gray-500">פנימית</span>
                </>
              )}
            </div>
          </div>
          {/<[a-z][\s\S]*>/i.test(note?.note || '') ? (
            <div 
              className="text-gray-800 text-right"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(
                  (note?.note || '')
                    .replace(/״/g, '')
                    .replace(/📱 ההודעה נשלחה דרך Mail & WhatsApp:\s*/g, ''),
                  { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'], ALLOWED_ATTR: ['href'] }
                )
              }} 
            />
          ) : (
            <p className="text-gray-800 text-right whitespace-pre-wrap">
              {note?.note
                ?.replace(/״/g, '')
                ?.replace(/📱 ההודעה נשלחה דרך Mail & WhatsApp:\s*/g, '')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};