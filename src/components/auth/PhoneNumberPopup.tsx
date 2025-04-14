import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PhoneNumberPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (phone: string) => void;
  isLoading?: boolean;
}

export const PhoneNumberPopup: React.FC<PhoneNumberPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const validatePhone = (phoneNumber: string) => {
    // Remove all non-digit characters except '+'
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Check for Israeli format (05XXXXXXXX or +972XXXXXXXXX)
    const israeliRegex = /^(?:(?:0[5])|(?:\+972[5]))\d{8}$/;
    
    return israeliRegex.test(cleanPhone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validatePhone(phone);
    
    if (isValid) {
      setError('');
      onSubmit(phone);
    } else {
      setError('מספר טלפון לא תקין');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
        {/* Cool decorative element on top */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-600 text-white p-4 rounded-full shadow-lg">
            <svg 
              className="w-8 h-8" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-right mb-6 mt-2">טלפון להצטרפות</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError('');
            }}
            placeholder="מספר טלפון לאישור"
            className={`w-full px-4 py-2 border-2 ${
              error ? 'border-red-500' : 'border-gray-200'
            } rounded-lg mb-1 text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all`}
            dir="ltr"
            // Added attributes for better phone field behavior
            autoComplete="tel"
            pattern="[0-9+]*"
            inputMode="tel"
            maxLength={13}
          />
          {error && (
            <p className="text-red-500 text-sm text-right mb-3">{error}</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg 
                hover:bg-blue-700 active:bg-blue-800 
                transition-all duration-200 ease-in-out
                shadow-md hover:shadow-lg
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 min-w-[120px]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>המשך</span>
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M11 7l-5 5m0 0l5 5m-5-5h12" 
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};