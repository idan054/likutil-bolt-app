import React, { useState, useEffect } from 'react';
import { X, TabletSmartphone } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';
import QRCode from 'react-qr-code';
import { generateReturnUrl } from '../auth/WooAuthButton';
import { useSettings } from '../../hooks/useSettings';

interface FloatingTipMessageProps {
  storageKey: string;
}

export const FloatingTipMessage: React.FC<FloatingTipMessageProps> = ({ storageKey}) => {
  const [user] = useAuthState(auth);

  const [isVisible, setIsVisible] = useState(true);
  const { settings } = useSettings();
  const storeUrl = settings?.storeUrl || '';

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey) === 'true';
    setIsVisible(!isDismissed);
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
  };

  if (!isVisible || !user) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-fade-in" dir="rtl">
      <div className="flex items-center flex-row-reverse justify-between bg-blue-50 py-6 px-8 rounded-[28px] shadow-xl w-[540px] border border-blue-100/50">
        <div className="relative">
          <div className="absolute inset-[-12px] border-2 border-blue-200/60 rounded-2xl" />
          <QRCode
            value={generateReturnUrl(storeUrl, true, '')}
            size={135}
            level="L"
            className="bg-white p-3 rounded-xl shadow-md"
          />
        </div>

        <div className="flex flex-col items-start text-right gap-2.5 pr-2">
          <h3 className="text-blue-900 text-2xl font-bold">חדש! התחברות מהירה מהסמארטפון</h3>
          <div className="flex flex-col gap-0.5">
            {/* <p className="text-blue-700 text-[15px] font-medium">רוצה לדעת תמיד מה קורה סביבך, בכל מקום?</p> */}
            <p className="text-blue-700 text-[15px] font-medium">הברקוד QR זמין גם במסך ההגדרות {'>>'}</p>
          </div>
          
          <div className="flex gap-3 mt-2">

            {/* <button
              onClick={handleDismiss}
              className="text-blue-700 hover:bg-blue-100/70 transition-all duration-200 text-[14px] bg-blue-100/50 px-6 py-2.5 rounded-full font-medium"
            >
              איזה יופי, תודה
            </button> */}

                <button 
                onClick={handleDismiss}
                className="text-white bg-blue-600 px-6 py-2.5 rounded-full text-[14px] font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow">
                    
                איזה יופי, תודה
                
                </button>
          </div>
        </div>
      </div>
    </div>
  );
};