import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogOut, TabletSmartphone } from 'lucide-react';
import { auth } from '../../../config/firebase';
import QRCode from 'react-qr-code';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { generateReturnUrl, generateWooAuthUrl } from '../../auth/WooAuthButton';
import { useSettings } from '../../../hooks/useSettings';

export const UserProfile: React.FC = () => {
  const [user] = useAuthState(auth);
  const { logout } = useAuth();
  
  const currentUser = user;
  
  if (!currentUser) return null;

  const { settings } = useSettings();

  return (
    <div className="text-center">
      {/* Profile Section - Flex on mobile */}
      <div className="flex sm:flex-col items-center gap-3">
        {/* Profile Image - Centered on desktop */}
        <div className="shrink-0 sm:mx-auto">
          <img
            src={currentUser.photoURL || 'https://www.gravatar.com/avatar?d=mp'}
            alt={currentUser.displayName || 'User avatar'}
            className="w-12 h-12 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-lg"
          />
        </div>

        {/* User Info - Aligned left on mobile, centered on desktop */}
        <div className="text-right sm:text-center sm:mt-4">
          <h3 className="text-base sm:text-lg font-semibold">
            {currentUser.displayName}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 break-words">
            {currentUser.email}
          </p>
        </div>
      </div>

      {/* QR Code Section - Hidden on mobile, visible on desktop */}
      {currentUser && (
        <div className="hidden sm:block mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="relative">
            <div className="flex justify-center opacity-100">
              <QRCode
                value={`${generateReturnUrl(settings?.storeUrl ?? '', true, '')}`}
                size={150}
                level="L"
                className="mx-auto p-3 bg-white rounded-lg shadow-sm"
                fgColor="#1a1a1a"
                bgColor="#ffffff"
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                }}
              />
            </div>

            {/* <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                זמין בקרוב...
              </span>
            </div> */}

          </div>
          <p className="mt-2 text-sm text-gray-600 text-center flex items-center justify-center gap-1.5">
            <TabletSmartphone size={16} className="inline-block" />
            סרוק להתחברות מהירה
          </p>
        </div>
      )}

      {/* Logout Button - Smaller on mobile */}
      <button
        onClick={logout}
        className="mt-2 sm:mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm sm:text-base"
      >
        <LogOut size={16} className="sm:w-5 sm:h-5" />
        <span>התנתק</span>
      </button>
    </div>
  );
};