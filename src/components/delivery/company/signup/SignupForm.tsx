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
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-xl shadow-lg max-w-md mx-auto">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          טלפון ליצירת קשר
        </label>
        <div className="relative">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            placeholder="הזן מספר טלפון"
            required
            dir="rtl"
            disabled={isSubmitting}
          />
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSubmitting ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-blue-600 bg-blue-50 px-5 py-3 rounded-lg border border-blue-100"
          >
            <Loader2 className="animate-spin" size={20} />
            <span className="font-medium">שולח בקשה...</span>
          </motion.div>
        ) : showSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-green-600 bg-green-50 px-5 py-3 rounded-lg border border-green-100"
          >
            <CheckCircle2 size={20} />
            <span className="font-medium">הבקשה נשלחה בהצלחה!</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="submit"
        disabled={isSubmitting || !phone.trim()}
        className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-3.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all duration-200 font-medium text-lg shadow-sm"
      >
        <Phone size={22} />
        <span>חזרו אליי בהקדם</span>
      </button>
    </form>
  );
};