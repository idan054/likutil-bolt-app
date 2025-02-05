import React, { useState } from 'react';
import { X, Send, Save, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuickMessages } from '../../hooks/useQuickMessages';
import { formatPhoneForWhatsapp } from '../../utils/phone';

interface QuickMessageModalProps {
  phone: string;
  onClose: () => void;
  savedMessages: string[];
}

export const QuickMessageModal: React.FC<QuickMessageModalProps> = ({
  phone,
  onClose,
  savedMessages,
}) => {
  const [message, setMessage] = useState('');
  const { saveMessage } = useQuickMessages();
  const [showSavedMessages, setShowSavedMessages] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    
    const whatsappNumber = formatPhoneForWhatsapp(phone);
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
    onClose();
  };

  const handleSave = () => {
    if (message.trim()) {
      saveMessage(message);
      setMessage('');
    }
  };

  const handleSelectSavedMessage = (savedMessage: string) => {
    setMessage(savedMessage);
    setShowSavedMessages(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg w-full max-w-md relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold">שליחת הודעה מהירה</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="הקלד הודעה..."
              className="w-full h-32 p-3 border rounded-lg resize-none text-right"
              dir="rtl"
            />
            
            {savedMessages.length > 0 && (
              <button
                onClick={() => setShowSavedMessages(!showSavedMessages)}
                className="absolute top-2 left-2 text-gray-400 hover:text-gray-600"
              >
                <Save size={20} />
              </button>
            )}
          </div>

          {/* Saved Messages Dropdown */}
          <AnimatePresence>
            {showSavedMessages && savedMessages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 bg-gray-50 rounded-lg border p-2 max-h-40 overflow-y-auto"
              >
                {savedMessages.map((savedMessage, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSavedMessage(savedMessage)}
                    className="w-full text-right p-2 hover:bg-gray-100 rounded text-sm"
                  >
                    {savedMessage}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-between gap-3">
          <button
            onClick={handleSave}
            disabled={!message.trim()}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={20} />
            <span>שמור תבנית</span>
          </button>
          
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={20} />
            <span>שלח</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};