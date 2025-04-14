import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowRightCircle, Loader2, LogInIcon } from 'lucide-react';
import {
  createFirebaseUser,
  tryGetUserData,
  signInFirebaseUser,
  BASE_URL,
  resetUserOneTimeToken,
  checkExistingUser,
  updateUserPhone,
  
} from '../../services/auth/woo-auth';
import { sanitizeUrl } from '../../utils/url';
import { generateStorePassword } from '../../utils/auth/password';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { PhoneNumberPopup } from './PhoneNumberPopup';
import { getUserData } from '../../services/user/user.service';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';
import { sendWhatsAppMessage } from '../order/notes/OrderNotes';

export const QR_MODE_PASS = 'GodMode2003';

export const generateReturnUrl = (cleanUrl: string, godMode: boolean, oneTimeToken: String | undefined) => {
  const isDevMode = (process.env.NODE_ENV === 'development');
  const host =  isDevMode ? 'https://my.likutil.co.il/dev' : 'https://my.likutil.co.il';
  
  // Should be genereted on Server (:
  const password = generateStorePassword(cleanUrl);
  
  const returnUrl = `${host}/?success=1&pass=${encodeURIComponent(
    password
  )}&source=${encodeURIComponent(cleanUrl)}&oneTimeToken=${godMode ?QR_MODE_PASS :  oneTimeToken}`;

  return returnUrl;
};


export const generateWooAuthUrl = (cleanUrl: string) => {

  const urlParams = new URLSearchParams(window.location.search);
  const phone = urlParams.get('phone') ?? '';
  const oneTimeToken = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const returnUrl = generateReturnUrl(cleanUrl, false, oneTimeToken);

  return `https://${cleanUrl}/wc-auth/v1/authorize?app_name=Likutil Login&scope=read_write&user_id=1&return_url=${encodeURIComponent(
    returnUrl
  )}&callback_url=${BASE_URL}/woo-auth-callback?source=${cleanUrl}/${oneTimeToken}/${phone}`;
};

export const WooAuthButton: React.FC = () => {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [storeUrl, setStoreUrl] = useState(() => {
    const cachedUrl = localStorage.getItem('woo_store_url');
    return cachedUrl || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [pendingCleanUrl, setPendingCleanUrl] = useState<string>('');

  useEffect(() => {
    const wooAutoLogin = async () => {
      console.log('START wooAutoLogin')
      const urlParams = new URLSearchParams(window.location.search);
      const oneTimeToken = urlParams.get('oneTimeToken');
      const success = urlParams.get('success');
      const source = urlParams.get('source');
      const pass = urlParams.get('pass');


      if (success && source && oneTimeToken && pass) {
        // Auto Firebase Login Logic Here
        
        
        console.log('Auto Login with Source:', source, 'Using oneTimeToken', oneTimeToken, 'and pass ', pass);
        
        try {
          // Auto Login Based Query Params
          try {
            // Sign in first to get Firestore access
            await signInFirebaseUser(source);
            
            // Now we can validate the token
            const existingUser = await tryGetUserData(source, oneTimeToken);
            console.log('existingUser', existingUser)
        
            if (existingUser) {
              // Token is valid, reset it
              await resetUserOneTimeToken(existingUser.userId);
            } else {
              // Invalid token - sign out
              await logout();
              console.error('Invalid one-time token or user not found');
            }
          } catch (error) {
            console.error('Error during auto login:', error);
          }
        } catch (error) {
          console.error('Error during auto login:', error);
        }
      }
    };

    wooAutoLogin();
  }, []);

  useEffect(() => {
    if (showUrlInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showUrlInput]);



const openWooAuthPopup = (cleanUrl: string) => {
  const isDevMode = (process.env.NODE_ENV === 'development');
  const wooAuthUrl = generateWooAuthUrl(cleanUrl);

  isDevMode
    ? window.open(wooAuthUrl, '_blank') // Opens in new tab
    : window.location.href = wooAuthUrl; // Current Tab
};

  const handleWooAuth = async () => {
    if (!storeUrl.trim() || isLoading) return;

    setIsLoading(true);
    const toastId = 'woo-auth';

    try {
      const cleanUrl = sanitizeUrl(storeUrl);
      localStorage.setItem('woo_store_url', cleanUrl);

      try {
        const uid = await createFirebaseUser(cleanUrl);
        if(uid) {
          toast.loading('יוצר משתמש חדש...', { id: toastId });
          console.log('Create new user');
          setPendingCleanUrl(cleanUrl);
          setShowPhonePopup(true);
          return; // Stop here and wait for phone number
        }
        
      } catch (error) {
        

        toast.loading('מתחבר למשתמש קיים...', { id: toastId });
        
      }
      openWooAuthPopup(cleanUrl);

    } catch (error) {
      console.error('[WooAuthButton] Auth failed:', error);
      toast.error('שגיאה בתהליך ההתחברות. אנא נסה שוב.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const [user] = useAuthState(auth);
  const handlePhoneSubmit = async (phone: string) => {
    setShowPhonePopup(false);
    if (pendingCleanUrl) {
      // Store the phone number in localStorage or state management if needed
      localStorage.setItem('user_phone', phone);
      
      console.log('user', user)
      console.log('phone', phone)
      console.log('pendingCleanUrl', pendingCleanUrl)
      await updateUserPhone(user?.uid ?? '', phone, 'woo');
      await sendWhatsAppMessage(
        phone,
        `ברוכים הבאים לליקוטיל! נשמח ממש שתשתף אותנו בחוויה שלך (: אנו קשובים מאד להצעות לשיפור. בנוסף אם אתה צריך עזרה צוות התמיכה כאן לשירותך!`,
      )
      await sendWhatsAppMessage(
        '972584770076',
        `ברכות! משתמש חדש הצטרף זה עתה לליקוטיל. הטלפון: ${phone} האתר: ${pendingCleanUrl}`,
      )
      openWooAuthPopup(pendingCleanUrl);
      setPendingCleanUrl('');
    }
  };

  if (!showUrlInput) {
    return (
      <button
        onClick={() => setShowUrlInput(true)}
        className="group relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 mb-0 mt-4"
      >
        <span className="font-bold mb-1">התחבר עם</span>
        <img
          src="/assets/svg/full-woo-white.svg"
          alt="WooCommerce Logo"
          className="h-8 transition-transform group-hover:scale-110"
        />
      </button>

      
    );
  }

  return (
    <>
      <div className="mt-4 space-y-3 relative">
        <button
          onClick={() => setShowUrlInput(false)}
          className="absolute left-0 -top-5 text-gray-300 hover:text-gray-600 text-sm font-medium transition-colors duration-200 hover:underline"
          disabled={isLoading}
        >
          ←
        </button>

        <div className="group relative w-full flex gap-4 bg-gray-50 p-2 rounded-xl border-2 border-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl hover:border-gray-300">
          <button
            onClick={handleWooAuth}
            disabled={!storeUrl.trim() || isLoading}
            className="text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110"
          >
            <div className={`flex items-center gap-2 p-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 ${(!isLoading && storeUrl.trim()) ? 'text-white' : 'text-gray-300'}`}>
    
              
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <ArrowRight className="w-8 h-8" />
              )}

<img
            src="/assets/svg/woo-white-logo-only.svg"
            alt="WooCommerce Logo"
            className="ml-2 h-10 transition-transform group-hover:scale-100"
          />
            </div>


          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder="כתובת האתר שלך"
            value={storeUrl}
            onChange={(e) => setStoreUrl(e.target.value)}
            className={`flex-1 px-2 py-2 text-[20px] font-medium text-gray-700 placeholder-opacity-50 placeholder-gray-600 bg-gray-50 rounded-lg outline-none focus:ring-0 transition-all duration-200 ${
              storeUrl ? 'text-left' : 'text-right'
            }`}
            dir="ltr"
            disabled={isLoading}
          />
        </div>
        
      </div>
    
      <PhoneNumberPopup
        isOpen={showPhonePopup}
        onClose={() => {
          setShowPhonePopup(false);
          setPendingCleanUrl('');
          setIsLoading(false);
        }}
        onSubmit={handlePhoneSubmit}
        isLoading={isLoading}
      />
    </>
  );
};


