import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowRightCircle, Loader2, LogInIcon } from 'lucide-react';
import { sanitizeUrl } from '../../utils/url';
import axios from 'axios';
import { u } from 'framer-motion/client';
import { BASE_URL, checkExistingUser, createFirebaseUser } from '../../services/auth/woo-auth';
import toast from 'react-hot-toast';
import { generateStorePassword } from '../../utils/auth/password';

export const ShopifyAuthButton: React.FC = () => {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [storeUrl, setStoreUrl] = useState(() => {
    const cachedUrl = localStorage.getItem('shopify_store_url');
    return cachedUrl || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getShopifyId = async (cleanUrl: string): Promise<string | null> => {
    console.log('getShopifyId')
    console.log('cleanUrl', cleanUrl)
    try {
    

        const response = await fetch(`${BASE_URL}/get-my-shopify-id?cleanUrl=${cleanUrl}`, {method: 'GET'});
        const data = await response.json();
        console.log('data', data)
        const redirectUrl = data.id;
        console.log('redirectUrl', redirectUrl)
    
  
      return redirectUrl;
    } catch (error) {
      console.error("Error fetching Shopify ID:", error);
      return null;
    }
  };

  const generateShopifyAuthUrl = (shopifyId: string,cleanUrl:string ) => {

    const urlParams = new URLSearchParams(window.location.search);
    const phone = urlParams.get('phone') ?? '';
    const oneTimeToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    const isDevMode = (process.env.NODE_ENV === 'development');

    // Should be genereted on Server (:
    const password = generateStorePassword(cleanUrl);
    
    return `https://${shopifyId}.myshopify.com/admin/oauth/authorize?client_id=b8ab9b43d4b7011b511ef8b83ee9c97a&scope=read_orders,write_orders,read_fulfillments,read_assigned_fulfillment_orders,read_customers,read_products,read_inventory,read_locations,read_shipping&redirect_uri=${BASE_URL}/shopify-auth&state=${cleanUrl}/${oneTimeToken}/${phone}/${isDevMode}/${password}`;
  };

  const openShopifyAuthPopup = async (cleanUrl: string) => {
    const shopifyId = await getShopifyId(cleanUrl);
  
    if (shopifyId) {
      
      const shopifyAuthUrl = generateShopifyAuthUrl(shopifyId, cleanUrl);
      // Open in a new tab
      window.open(shopifyAuthUrl, '_blank');
    } else {
      console.error("Failed to retrieve Shopify ID");
    }
  };

  const handleShopifyAuth = async () => {
    if (!storeUrl.trim() || isLoading) return;

    setIsLoading(true);
    const toastId = 'woo-auth';

    try {
      const cleanUrl = sanitizeUrl(storeUrl);
      localStorage.setItem('woo_store_url', cleanUrl);


      try {
        await createFirebaseUser(cleanUrl);
       toast.loading('יוצר משתמש חדש...', { id: toastId });
       console.log('Create new user');
     } catch (error) {
   
       toast.loading('מתחבר למשתמש קיים...', { id: toastId });
     }
     openShopifyAuthPopup(cleanUrl);

      
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
        className="group relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 mb-0 mt-4"
      >
        <span className="font-bold mb-1">התחבר עם</span>
        <img
          src="/assets/images/shopify_logo.png"
          alt="Shopify Logo"
          className="h-9 transition-transform group-hover:scale-110 pb-0"
        />
      </button>
    );
  }

  return (
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
          onClick={handleShopifyAuth}
          disabled={!storeUrl.trim() || isLoading}
          className="text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110"
        >
          <div className={`flex items-center gap-2 p-2 rounded-xl bg-gradient-to-r from-[#96BF47] to-[#5E8E3E] ${(!isLoading && storeUrl.trim()) ? 'text-white' : 'text-gray-300'}`}>
    
            
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <ArrowRight className="w-8 h-8" />
            )}

<img
       src="/assets/svg/shopify-logo-only.svg"
          alt="Shopify Logo"
          className="ml-2 h-10 transition-transform group-hover:scale-100"
        />
          </div>


        </button>

        <input
          ref={inputRef}
          type="text"
          placeholder="כתובת החנות שלך"
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
  );
};