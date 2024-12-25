import React, { useState, useRef, useEffect } from 'react';
import { Store, ArrowRightCircle, Loader2 } from 'lucide-react';
import {
  createWooUser,
  checkExistingUser,
  signInWooUser,
} from '../../services/auth/woo-auth';
import { sanitizeUrl } from '../../utils/url';
import { generateStorePassword } from '../../utils/auth/password';
import { toast } from 'react-hot-toast';

export const WooAuthButton: React.FC = () => {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const autoLogin = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const source = urlParams.get('source');
      const pass = urlParams.get('pass');

      if (success && source && pass) {
        // Auto Firebase Login Logic Here

        console.log('Auto Login with Source:', source, 'and Pass:', pass);

        try {
          const cleanUrl = sanitizeUrl(source);
          const existingUser = await checkExistingUser(source);
          await signInWooUser(existingUser.email, cleanUrl);
        } catch (error) {
          console.error('Error during auto login:', error);
        }
      }
    };

    autoLogin();
  }, []);

  useEffect(() => {
    if (showUrlInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showUrlInput]);

  const openWooAuthPopup = (cleanUrl: string, firebaseId: string) => {
    const password = generateStorePassword(cleanUrl);
    const returnUrl = `https://likutil.co.il/?success&pass=${encodeURIComponent(
      password
    )}&source=${encodeURIComponent(cleanUrl)}`;

    const wooAuthUrl = `https://${cleanUrl}/wc-auth/v1/authorize?app_name=Likutil&scope=read_write&user_id=1&return_url=${encodeURIComponent(
      returnUrl
    )}&callback_url=https://api.likutil.co.il/woo-auth-callback?source=${cleanUrl}&firebaseId=${firebaseId}`;

    window.location.href = wooAuthUrl; // Directly navigate to the authorization URL
  };

  const handleWooAuth = async () => {
    if (!storeUrl.trim() || isLoading) return;

    setIsLoading(true);
    const toastId = 'woo-auth';

    try {
      const cleanUrl = sanitizeUrl(storeUrl);

      // Check if user exists
      const existingUser = await checkExistingUser(cleanUrl);
      console.log('existingUser');
      console.log(existingUser.exists);

      if (existingUser.exists) {
        toast.loading('מתחבר למשתמש קיים...', { id: toastId });
        console.log('Sign in existing user');
        // await signInWooUser(existingUser.email, cleanUrl);
        // openWooAuthPopup(cleanUrl, existingUser.userId);

        openWooAuthPopup(cleanUrl, '1');
      } else {
        toast.loading('יוצר משתמש חדש...', { id: toastId });

        console.log('Create new user');
        const { firebaseId, cleanUrl: newCleanUrl } = await createWooUser(
          storeUrl
        );

        openWooAuthPopup(newCleanUrl, firebaseId);
      }
    } catch (error) {
      console.error('[WooAuthButton] Auth failed:', error);
      toast.error('שגיאה בתהליך ההתחברות. אנא נסה שוב.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (!showUrlInput) {
    return (
      <button
        onClick={() => setShowUrlInput(true)}
        className="group relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-purple-50 text-purple-700 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-100 transition-all duration-200 shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 mt-4"
      >
        <Store className="w-6 h-6 transition-transform group-hover:scale-110" />
        <span className="font-medium">התחבר עם WooCommerce</span>
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="group relative w-full flex gap-4 bg-purple-50 p-2 rounded-xl border-2 border-purple-200 transition-all duration-200 shadow-lg hover:shadow-xl hover:border-purple-400">
        <button
          onClick={handleWooAuth}
          disabled={!storeUrl.trim() || isLoading}
          className="text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110"
        >
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <ArrowRightCircle className="w-8 h-8" />
          )}
        </button>

        <input
          ref={inputRef}
          type="text"
          placeholder="example.co.il"
          value={storeUrl}
          onChange={(e) => setStoreUrl(sanitizeUrl(e.target.value))}
          className="flex-1 px-2 py-2 text-[20px] font-medium text-purple-700 placeholder-opacity-50 placeholder-purple-600 bg-purple-50 rounded-lg text-left outline-none focus:ring-0 transition-all duration-200"
          dir="ltr"
          disabled={isLoading}
        />
      </div>

      <button
        onClick={() => setShowUrlInput(false)}
        className="text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors duration-200 hover:underline text-left"
        disabled={isLoading}
      >
        חזור
      </button>
    </div>
  );
};
