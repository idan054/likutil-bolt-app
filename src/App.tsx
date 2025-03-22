import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthWrapper } from './components/auth/AuthWrapper';
import { OrdersDashboard } from './components/dashboard/OrdersDashboard';
import { Header } from './components/layout/Header';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { useAppState } from './hooks/useAppState';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { DevPage } from './components/dev/DevPage';




export const APP_VERSION = '22.03.25 | Version 1.1';

// FROM MAC
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
        <Route 
          path="/dev" 
          element={<DevPage />} 
        />
        <Route
          path="/*"
          element={
            <AuthWrapper>
              <div className="min-h-screen bg-gray-100" dir="rtl">
                <Toaster position="top-left" />
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

