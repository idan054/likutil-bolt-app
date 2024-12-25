import React, { useState, useEffect } from 'react';
import { Phone, Globe, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliveryRequest } from '../../../hooks/useDeliveryRequest';
import type { DeliveryIntegration } from '../../../types/delivery';

interface DeliveryRequestFormProps {
  integration: DeliveryIntegration;
}

export const DeliveryRequestForm: React.FC<DeliveryRequestFormProps> = ({
  integration,
}) => {
  const [phone, setPhone] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { isSubmitting, loadSavedPhone, submitRequest } = useDeliveryRequest();

  useEffect(() => {
    const loadPhone = async () => {
      const savedPhone = await loadSavedPhone();
      if (savedPhone) {
        setPhone(savedPhone);
      }
    };
    loadPhone();
  }, [loadSavedPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || isSubmitting) return;

    try {
      await submitRequest(integration, phone);
      setShowSuccess(true);
      // Reset success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <div className="mt-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start gap-6">
        <div className="shrink-0">
          <img
            src={integration.logoUrl}
            alt={integration.name}
            className="w-24 h-24 object-contain"
          />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">{integration.name}</h3>
            <p className="text-gray-600">{integration.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                טלפון ליצירת קשר
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-right"
                placeholder="הזן מספר טלפון"
                required
                dir="rtl"
                disabled={isSubmitting}
              />
            </div>

            {/* Status Messages */}
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg"
                >
                  <Loader2 className="animate-spin" size={20} />
                  <span>שולח בקשה...</span>
                </motion.div>
              ) : showSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg"
                >
                  <CheckCircle2 size={20} />
                  <span className="font-medium">הבקשה נשלחה בהצלחה!</span>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting || !phone.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Phone size={20} />
              <span>חזרו אליי בהקדם</span>
            </button>
          </form>

          <div className="flex flex-col gap-2 text-sm text-gray-600">
            {integration.controlPanelLink && (
              <a
                href={integration.controlPanelLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Globe size={16} />
                <span>פאנל ניהול {integration.name}</span>
              </a>
            )}

            {integration.fields[0]?.supportPhone && (
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>התקשרו עכשיו:</span>
                <a
                  href={`tel:${integration.fields[0].supportPhone}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {integration.fields[0].supportPhone}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
