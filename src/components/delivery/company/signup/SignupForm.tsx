import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Loader2, CheckCircle2 } from 'lucide-react';
import { useDeliveryRequest } from '../../../../hooks/useDeliveryRequest';
import type { DeliveryIntegration } from '../../../../types/delivery';

interface SignupFormProps {
  integration: DeliveryIntegration;
}

export const SignupForm: React.FC<SignupFormProps> = ({ integration }) => {
  const [phone, setPhone] = useState('');
  const { isSubmitting, loadSavedPhone, submitRequest } = useDeliveryRequest();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadPhone = async () => {
      const savedPhone = await loadSavedPhone();
      if (savedPhone) setPhone(savedPhone);
    };
    loadPhone();
  }, [loadSavedPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || isSubmitting) return;

    try {
      await submitRequest(integration, phone);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to submit request:', error);
    }
  };

  return (
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
  );
};