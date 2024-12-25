import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { translations } from '../../../config/translations';
import { AutoResizeTextArea } from '../../ui/AutoResizeTextArea';

interface NoteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const NoteInput: React.FC<NoteInputProps> = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <AutoResizeTextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={translations.orderNotes.placeholder}
        className="flex-1 px-4 py-2 border rounded-lg text-right min-h-[40px] max-h-[200px]"
        disabled={isSubmitting}
      />
      <button
        type="submit"
        disabled={isSubmitting || !value.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-[40px]"
      >
        <Send size={18} />
        <span>שלח</span>
      </button>
    </form>
  );
};