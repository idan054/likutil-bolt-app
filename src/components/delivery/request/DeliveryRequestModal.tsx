import React, { useState, useEffect, useCallback } from 'react';
import { X, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDeliveryRequest } from '../../../hooks/useDeliveryRequest';
import type { DeliveryIntegration } from '../../../types/delivery';

interface DeliveryRequestModalProps {
  integration: DeliveryIntegration;
  onClose: () => void;
}

export const DeliveryRequestModal: React.FC<DeliveryRequestModalProps> = ({
  integration,
  onClose,
}) => {
  const [phone, setPhone] = useState('');
  const { isSubmitting, loadSavedPhone, submitRequest } = useDeliveryRequest();

  // Load saved phone on mount
  useEffect(() => {
    const loadPhone = async () => {
      const savedPhone = await loadSavedPhone();
      if (savedPhone) {
        setPhone(savedPhone);
      }
    };
    loadPhone();
  }, [loadSavedPhone]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and basic phone characters
    const value = e.target.value.replace(/[^\d\s\-+()]/g, '');
    setPhone(value);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    try {
      await submitRequest(integration, phone);
      toast.success('הבקשה נשלחה בהצלחה!');
      onClose();
    } catch (error) {
      toast.error('שגיאה בשליחת הבקשה');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">בקשת חיבור ל{integration.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <img
            src={integration.logoUrl}
            alt={integration.name}
            className="h-16 w-auto mx-auto mb-4"
          />
          <p className="text-gray-600 text-center">{integration.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              טלפון ליצירת קשר
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              className="w-full px-4 py-2 border rounded-lg text-right"
              placeholder="הזן מספר טלפון"
              required
              dir="rtl"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !phone.trim()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={18} />
            <span>חזרו אליי בהקדם</span>
          </button>
        </form>
      </div>
    </div>
  );
};