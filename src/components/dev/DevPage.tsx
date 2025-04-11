import React, { useState, useEffect } from 'react';
import { APP_VERSION } from '../../App';
import { BASE_URL } from '../../services/auth/woo-auth';

export const DevPage: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [shopifyAuthStatus, setShopifyAuthStatus] = useState<'none' | 'loading' | 'success' | 'error'>('none');

  useEffect(() => {
    // Get query params
    const params = new URLSearchParams(window.location.search);
    const paramsObject: Record<string, string> = {};
    params.forEach((value, key) => {
      paramsObject[key] = value;
    });
    setQueryParams(paramsObject);

    // Check if we have all required Shopify params
    // if (paramsObject.shop && paramsObject.code) {
      const handleShopifyAuth = async () => {
        console.log('handleShopifyAuth')
        setShopifyAuthStatus('loading');
        try {
          const response = await fetch(`${BASE_URL}/shopify-auth?${new URLSearchParams(paramsObject)}`, {
            redirect: 'manual' // Prevent automatic redirect handling
          });
          console.log('response: ', response)
          
          if (response.type === 'opaqueredirect') {
            // Get the redirect URL from response headers
            const redirectUrl = response.headers.get('Location');
            if (redirectUrl) {
              window.location.href = redirectUrl;
            }
          } else {
            setShopifyAuthStatus('error');
          }
        } catch (error) {
          setShopifyAuthStatus('error');
        }
      };
      handleShopifyAuth();
    // }

    const checkServerStatus = async () => {
      try {
        const response = await fetch(BASE_URL);
        setServerStatus(response.status === 200 ? 'online' : 'offline');
      } catch (error) {
        setServerStatus('offline');
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8" dir="ltr">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-left">Development Environment</h1>
        <div className="space-y-4">
          {/* Add Shopify Auth Status section */}
          {shopifyAuthStatus !== 'none' && (
            <div className="p-4 bg-gray-50 rounded-lg text-left">
              <h2 className="font-medium">Shopify Authentication Status</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-3 h-3 rounded-full ${
                  shopifyAuthStatus === 'success' ? 'bg-green-500' : 
                  shopifyAuthStatus === 'error' ? 'bg-red-500' : 
                  'bg-yellow-500'
                }`} />
                <p className="text-gray-600">
                  {shopifyAuthStatus === 'loading' ? 'Processing authentication...' :
                   shopifyAuthStatus === 'success' ? 'Authentication successful' :
                   'Authentication failed'}
                </p>
              </div>
            </div>
          )}

          {/* Add new Query Parameters section */}
          <div className="p-4 bg-gray-50 rounded-lg text-left">
            <h2 className="font-medium">Query Parameters</h2>
            {Object.keys(queryParams).length > 0 ? (
              <div className="mt-2">
                {Object.entries(queryParams).map(([key, value]) => (
                  <div key={key} className="text-gray-600">
                    <span className="font-medium">{key}:</span> {value}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No query parameters present</p>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg text-left">
            <h2 className="font-medium">How To Login on debugMode</h2>
            <p className="text-gray-600">1) COPY & PASTE the query params</p>
            <p className="text-gray-600">2) Replace likutil.co.il/dev/ with localhost:5173/</p>
            <p className="text-gray-600">Its because "oneTimeToken" expires!</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg text-left">
            <h2 className="font-medium">Version Info</h2>
            <p className="text-gray-600">{APP_VERSION}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg text-left">
            <h2 className="font-medium">Server Status</h2>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${serverStatus === 'online' ? 'bg-green-500' : serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <p className="text-gray-600">
                api.likutil.co.il is {serverStatus === 'loading' ? 'checking...' : serverStatus}
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg text-left">
            <h2 className="font-medium">Environment</h2>
            <p className="text-gray-600">{process.env.NODE_ENV}</p>
          </div>
        </div>
      </div>
    </div>
  );
};