import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Loader2, CheckCircle2, Save, XCircle } from 'lucide-react';
import { useDeliveryIntegrations } from '../../../../hooks/settings/useDeliveryIntegrations';
import type { DeliveryIntegration } from '../../../../types/delivery';

interface ConfigFormProps {
  integration: DeliveryIntegration;
  initialApiKey?: string;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ 
  integration,
  initialApiKey = ''
}) => {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const { saveIntegration, testIntegration, isLoading, isTesting } = useDeliveryIntegrations();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (initialApiKey) {
      setApiKey(initialApiKey);
    }
  }, [initialApiKey]);

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    const success = await testIntegration(integration.id, apiKey);
    if (success) {
      setShowSuccess(true);
      setShowError(false);
      setTimeout(() => setShowSuccess(false), 6000);
    } else {
      setShowError(true);
      setShowSuccess(false);
      setTimeout(() => setShowError(false), 6000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || isLoading) return;

    try {
      await saveIntegration(integration.id, { key: apiKey });
      setShowSuccess(true);
      setShowError(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      setShowError(true);
      setShowSuccess(false);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {integration.fields[0]?.label || 'מפתח התחברות'}
        </label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
          placeholder={integration.fields[0]?.placeholder || 'הזן את מפתח ההתחברות שלך'}
          required
          disabled={isLoading}
        />
        {integration.fields[0]?.supportText && (
          <p className="mt-1 text-sm text-gray-500">
            {integration.fields[0].supportText}
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isLoading || isTesting ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg"
          >
            <Loader2 className="animate-spin" size={20} />
            <span>{isTesting ? 'בודק חיבור...' : 'שומר הגדרות...'}</span>
          </motion.div>
        ) : showSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg"
          >
            <CheckCircle2 size={20} />
            <span className="font-medium">
              {isTesting ? 'החיבור נבדק בהצלחה!' : 'המידע התקבל בהצלחה!'}
            </span>
          </motion.div>
        ) : showError ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg"
          >
            <XCircle size={20} />
            <span className="font-medium">
              {isTesting ? 'בדיקת החיבור נכשלה' : 'אופס! נראה שיש בעיה'}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={handleTest}
          disabled={isLoading || isTesting || !apiKey.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <Key size={20} />
          <span>בדיקת חיבור</span>
        </button>

        <button
          type="submit"
          disabled={isLoading || !apiKey.trim()}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save size={20} />
          <span>שמור הגדרות</span>
        </button>
      </div>
    </form>
  );
};