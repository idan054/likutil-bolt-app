import React, { useRef, useEffect, useState } from 'react';
import { Send, Save, ChevronDown } from 'lucide-react';
import { noteTypeColors } from './NoteTypeSelector';
import { translations } from '../../../config/translations';
import { AutoResizeTextArea } from '../../ui/AutoResizeTextArea';
import { SavedTemplatesCarousel } from './SavedTemplatesCarousel';
import { useQuickMessages } from '../../../hooks/useQuickMessages';

interface NoteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  showTemplates: boolean;
  onToggleTemplates: () => void;
  noteType: 'private' | 'customer' | 'whatsapp';
}

export const NoteInput: React.FC<NoteInputProps> = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  showTemplates,
  onToggleTemplates,
  noteType,
}) => {
  const { messages, saveMessage } = useQuickMessages();

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

  const handleSaveTemplate = async () => {
    if (value.trim()) {
      await saveMessage(value);
      onToggleTemplates(); // Show templates after saving
    }
  };

  const handleSelectTemplate = (template: string) => {
    onChange(template);
  };

  return (
    <div className="space-y-3">
      {/* Templates Toggle Button - Only show if there are templates */}
      {messages.length > 0 && (
        <button
          onClick={onToggleTemplates}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <ChevronDown
            className={`transform transition-transform duration-200 ${
              showTemplates ? 'rotate-180' : ''
            }`}
            size={16}
          />
          <span>תבניות שמורות ({messages.length})</span>
        </button>
      )}

      {/* Saved Templates Carousel */}
      {messages.length > 0 && (
        <SavedTemplatesCarousel
          templates={messages}
          onSelect={handleSelectTemplate}
          isVisible={showTemplates}
          onVisibilityChange={onToggleTemplates}
        />
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <AutoResizeTextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={translations.orderNotes.placeholder}
          className="flex-1 px-4 py-2 border rounded-lg text-right min-h-[40px] max-h-[200px]"
          disabled={isSubmitting}
        />
        
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSaveTemplate}
            disabled={isSubmitting || !value.trim()}
            className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="שמור כתבנית"
          >
            <Save size={20} />
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || !value.trim()}
            className={`${noteTypeColors[noteType].button} text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 ease-in-out hover:opacity-90`}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};