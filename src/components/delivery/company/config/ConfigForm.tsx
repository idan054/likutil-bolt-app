import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Loader2, CheckCircle2, Save, XCircle } from 'lucide-react';
import { useDeliveryIntegrations } from '../../../../hooks/settings/useDeliveryIntegrations';
import type { DeliveryIntegration } from '../../../../types/delivery';
import { DeliveryProgramType } from '../../../settings/tabs/sections/delivery/marketplace/AddDeliveryCompanyCard';

interface ConfigFormProps {
  integration: DeliveryIntegration;
}

interface ConfigFormField {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password';
  supportText?: string;
}

const getFieldsByProgramType = (type: DeliveryProgramType): ConfigFormField[] => {
  switch (type) {
    case DeliveryProgramType.BALDAR:
      return [
        {
          id: 'username',
          label: 'שם משתמש',
          placeholder: 'הזן את שם המשתמש שלך',
          type: 'text',
          // supportText: 'שם המשתמש לחשבון BALDAR שלך'
        },
        {
          id: 'password',
          label: 'סיסמה',
          placeholder: 'הזן את הסיסמה שלך',
          type: 'password',
          // supportText: 'הסיסמה לחשבון BALDAR שלך'
        }
      ];
    case DeliveryProgramType.RUN:
      return [
        {
          id: 'username',
          label: 'שם משתמש',
          placeholder: 'הזן את שם המשתמש שלך',
          type: 'text',
          // supportText: 'שם המשתמש לחשבון RUN שלך'
        },
        {
          id: 'password',
          label: 'סיסמה',
          placeholder: 'הזן את הסיסמה שלך',
          type: 'password',
          // supportText: 'הסיסמה לחשבון RUN שלך'
        }
      ];
    case DeliveryProgramType.LION_WHEEL:
      return [
        {
          id: 'token',
          label: 'טוקן',
          placeholder: 'הזן את הטוקן שלך',
          type: 'text',
          supportText: 'הטוקן שקיבלת מחברת Lion Wheel'
        }
      ];
    default:
      return [
        {
          id: 'key',
          label: 'מפתח התחברות',
          placeholder: 'הזן את מפתח ההתחברות שלך',
          type: 'text',
          supportText: ''
        }
      ];
  }
};

export const ConfigForm: React.FC<ConfigFormProps> = ({ 
  integration,
}) => {
  const { activeIntegrations } = useDeliveryIntegrations();

  const activeIntegration = activeIntegrations.find(
    (item) => item.provider === integration.provider
  );

  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initialData: Record<string, string> = {};
    switch (activeIntegration?.programType) {
      case DeliveryProgramType.RUN:
        initialData.username = activeIntegration?.username || '';
        initialData.password = activeIntegration?.password || '';
        break;
      case DeliveryProgramType.BALDAR:
        initialData.username = activeIntegration?.username || '';
        initialData.password = activeIntegration?.password || '';
        break;
      case DeliveryProgramType.LION_WHEEL:
        initialData.token = activeIntegration?.token || '';
        break;
    }
    return initialData;
  });


  useEffect(() => {
    if (!activeIntegrations) return;

    const currentActiveIntegration = activeIntegrations.find(
      (item) => item.provider === integration.provider
    );

    // Update form data when integration changes
    const newFormData = (() => {
      switch (currentActiveIntegration?.programType) {
        case DeliveryProgramType.RUN:
          return {
            username: currentActiveIntegration?.username || '',
            password: currentActiveIntegration?.password || ''
          };
        case DeliveryProgramType.BALDAR:
          return {
            username: currentActiveIntegration?.username || '',
            password: currentActiveIntegration?.password || ''
          };
        case DeliveryProgramType.LION_WHEEL:
          return {
            token: currentActiveIntegration?.token || ''
          };
        default:
          return {};
      }
    })();
    setFormData(newFormData as Record<string, string>);
  }, [integration, activeIntegrations]);

  const { saveIntegration, testIntegration, isLoading, isTesting } = useDeliveryIntegrations();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleTest = async () => {
    if (Object.values(formData).some(value => !value.trim())) return;
    const success = await testIntegration(integration, formData);
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
    // if (Object.values(formData).some(value => !value.trim()) || isLoading) return;

    try {
      await saveIntegration(integration.provider, formData);
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

  const fields = getFieldsByProgramType(integration.programType as DeliveryProgramType);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type={field.type}
              // Replace the value prop in the input component
              value={formData[field.id] || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
              placeholder={field.placeholder}
              required
              disabled={isLoading}
            />
            {field.supportText && (
              <p className="mt-1 text-sm text-gray-500">
                {field.supportText}
              </p>
            )}
          </div>
        ))}
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
          disabled={isLoading || isTesting || fields.some(field => !formData[field.id]?.trim())}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <Key size={20} />
          <span>בדיקת חיבור</span>
        </button>

        <button
          type="submit"
          disabled={isLoading || fields.some(field => !formData[field.id]?.trim())}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save size={20} />
          <span>שמור הגדרות</span>
        </button>
      </div>
    </form>
  );
};