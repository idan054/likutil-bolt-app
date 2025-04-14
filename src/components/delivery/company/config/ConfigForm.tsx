import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Loader2, CheckCircle2, Save, XCircle, Eye, EyeOff } from 'lucide-react';
import { useDeliveryIntegrations } from '../../../../hooks/settings/useDeliveryIntegrations';
import type { DeliveryIntegration } from '../../../../types/delivery';
import { DeliveryProgramType } from '../../../settings/tabs/sections/delivery/marketplace/AddDeliveryCompanyCard';
import { WooCommerceHelpBox } from '../../../settings/tabs/sections/WooCommerceHelpBox';

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
          placeholder: 'שם המשתמש שלך ב ',
          type: 'text',
          // supportText: 'שם המשתמש לחשבון BALDAR שלך'
        },
        {
          id: 'password',
          label: 'סיסמה',
          placeholder: 'הסיסמה שלך ב ',
          type: 'password',
          // supportText: 'הסיסמה לחשבון BALDAR שלך'
        }
      ];
    case DeliveryProgramType.RUN:
      return [
        {
          id: 'username',
          label: 'שם משתמש',
          placeholder: 'שם המשתמש שלך ב ',
          type: 'text',
          // supportText: 'שם המשתמש לחשבון RUN שלך'
        },
        {
          id: 'password',
          label: 'סיסמה',
          placeholder: 'הסיסמה שלך ב ',
          type: 'password',
          // supportText: 'הסיסמה לחשבון RUN שלך'
        }
      ];
      case DeliveryProgramType.UPS:
        return [
          {
            id: 'clientId',
            label: 'מס׳ לקוח',
            placeholder: 'מס׳ לקוח שלך ב',
            type: 'text',
            // supportText: 'שם המשתמש לחשבון RUN שלך'
          },
          {
            id: 'username',
            label: 'אימייל',
            placeholder: 'האימייל שלך ב ',
            type: 'text',
            // supportText: 'שם המשתמש לחשבון RUN שלך'
          },
          {
            id: 'password',
            label: 'סיסמה',
            placeholder: 'הסיסמה שלך ב ',
            type: 'password',
            // supportText: 'הסיסמה לחשבון RUN שלך'
          }
  
        ];
    case DeliveryProgramType.LION_WHEEL:
      return [
        {
          id: 'token',
          label: 'טוקן',
          placeholder: 'הטוקן שקיבלת מ ',
          type: 'text',
          supportText: ''
        }
      ];
    default:
      return [
        {
          id: 'key',
          label: 'מפתח ברירת מחדש',
          placeholder: 'עדכן את מפתח ההתחברות שלך',
          type: 'text',
          supportText: ''
        }
      ];
  }
};

export const ConfigForm: React.FC<ConfigFormProps> = ({ integration }) => {
  // Add this state for password visibility
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
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
        case DeliveryProgramType.UPS:
          initialData.username = activeIntegration?.username || '';
          initialData.password = activeIntegration?.password || '';
          initialData.clientId = activeIntegration?.clientId || '';
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
          case DeliveryProgramType.UPS:
            return {
              username: currentActiveIntegration?.username || '',
              password: currentActiveIntegration?.password || '',
              clientId: currentActiveIntegration?.clientId || ''
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
      <div className="space-y-0">
        {fields.map((field, index) => (
          <div key={index}>
            <div className="relative">
   <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">
              {field.label}
            </label>

              <input
                type={field.type === 'password' && showPasswords[field.id] ? 'text' : field.type}
                value={formData[field.id] || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg text-sm"
                placeholder={`${field.placeholder}${integration.name}`}
                required
                disabled={isLoading}
              />


              {field.type === 'password' && (
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, [field.id]: !prev[field.id] }))}
                  className="absolute left-3 bottom-1 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords[field.id] ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}

              
            </div>
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
            <span>{isTesting ? 'בודק חיבור...' : 'שומר חיבור...'}</span>
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

        {/* <WooCommerceHelpBox />   */}

              {/* <WooCommerceHelpBox /> */}


              {/* Perfect Whatsapp Button */}
{/* <a
  href="https://wa.me/+972557113987"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 transition-colors shadow-sm"
  title="תמיכה בוואטסאפ"
>
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_5_9)">
      <path d="M16.0481 13.1147L16.0398 13.1835C14.0241 12.1788 13.8133 12.045 13.5529 12.4355C13.3723 12.7059 12.8462 13.3192 12.6876 13.5007C12.5272 13.6794 12.3677 13.6932 12.0954 13.5694C11.8204 13.4319 10.9377 13.1432 9.89267 12.2082C9.07867 11.4794 8.53234 10.5857 8.371 10.3107C8.10242 9.84683 8.66434 9.78083 9.17584 8.81283C9.2675 8.62033 9.22075 8.46908 9.15292 8.33249C9.08417 8.19499 8.53692 6.84749 8.30775 6.31033C8.08775 5.77499 7.86134 5.84283 7.69175 5.84283C7.16375 5.79699 6.77784 5.80433 6.43775 6.15816C4.95825 7.78433 5.33134 9.46183 6.59725 11.2457C9.08509 14.5017 10.4106 15.1012 12.8343 15.9335C13.4888 16.1416 14.0855 16.1122 14.5576 16.0444C15.0838 15.961 16.1773 15.3835 16.4056 14.7372C16.6393 14.091 16.6393 13.5547 16.5706 13.431C16.5028 13.3072 16.3231 13.2385 16.0481 13.1147Z" fill="white"/>
      <path d="M18.81 3.16139C11.7618 -3.65219 0.0971667 1.28956 0.0925833 10.9017C0.0925833 12.8231 0.595833 14.6967 1.55467 16.3513L0 21.9998L5.80708 20.4855C13.0533 24.3996 21.9963 19.2021 22 10.9072C22 7.99589 20.8633 5.25598 18.7962 3.19714L18.81 3.16139ZM20.1685 10.877C20.163 17.8739 12.4822 22.2436 6.4075 18.6723L6.0775 18.4761L2.64 19.3699L3.56125 16.0286L3.34217 15.6849C-0.438167 9.66698 3.905 1.80198 11.066 1.80198C12.2619 1.79897 13.4464 2.03318 14.5512 2.49106C15.6559 2.94894 16.6588 3.62138 17.5019 4.46948C18.3496 5.30692 19.022 6.30483 19.4798 7.40496C19.9377 8.50508 20.1718 9.68539 20.1685 10.877Z" fill="white"/>
    </g>
    <defs>
      <clipPath id="clip0_5_9">
        <rect width="22" height="22" fill="white"/>
      </clipPath>
    </defs>
  </svg>
</a> */}
     

        <button
          type="submit"
          disabled={isLoading || fields.some(field => !formData[field.id]?.trim())}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <span className="text-1xl font-bold">1.</span>
          <span>שמור פרטים</span>
          <Save size={20} />
        </button>


        <button
          type="button"
          onClick={handleTest}
          disabled={isLoading || isTesting || fields.some(field => !formData[field.id]?.trim())}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 outline outline-1 outline-blue-200"
        >
          <div className="flex items-center gap-2">
            <span className="text-1xl font-bold">2.</span>
            <span>בדוק חיבור</span>
          </div>
          <Key size={20} />
        </button>
      </div>


    </form>
  );
};