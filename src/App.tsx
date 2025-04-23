import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthWrapper } from './components/auth/AuthWrapper';
import { OrdersDashboard } from './components/dashboard/OrdersDashboard';
import { Header } from './components/layout/Header';
import { OfflineIndicator, ServerOfflineIndicator } from './components/ui/OfflineIndicator';
import { useAppState } from './hooks/useAppState';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { DevPage } from './components/dev/DevPage';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from '@shopify/app-bridge-utils';
import { Redirect } from '@shopify/app-bridge/actions';

export const APP_VERSION = '21.04.25 | Version 1.2.2';

// Check if we're in an embedded context (inside Shopify admin)
const isEmbedded = window !== window.parent;

// Only initialize App Bridge if host param exists and we're embedded
const queryParams = new URLSearchParams(window.location.search);
const host = queryParams.get('host');
const shop = queryParams.get('shop');

export const app = isEmbedded && host
  ? createApp({
      apiKey: 'c7c3102bc10b592d8e107b0967670c7b',
      host,
      forceRedirect: true,
    })
  : undefined;

export async function fetchWithSessionToken(url: string, init: RequestInit = {}) {
  if (!app) {
    // Not embedded: fallback to regular fetch
    return fetch(url, init);
  }

  try {
    const token = await getSessionToken(app);
    return fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Failed to get session token', error);
    return fetch(url, init); // fallback
  }
}

export const App: React.FC = () => {
  const { isInitialized, hasSettings, isLoading } = useAppState();

  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dev" element={<DevPage />} />
        <Route
          path="/*"
          element={
            <AuthWrapper>
              <div className="min-h-screen bg-gray-100" dir="rtl">
                <Toaster position="top-left" />
                <ServerOfflineIndicator />
                <OfflineIndicator />
                <div className="container mx-auto px-4 py-8">
                  <Header />
                  <OrdersDashboard />
                </div>
              </div>
            </AuthWrapper>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
