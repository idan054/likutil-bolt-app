import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthWrapper } from './components/auth/AuthWrapper';
import { OrdersDashboard } from './components/dashboard/OrdersDashboard';
import { Header } from './components/layout/Header';
import { NoSettings } from './components/settings/NoSettings';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { useAppState } from './hooks/useAppState';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// FROM BACKUP
export const App: React.FC = () => {
  const { isInitialized, hasSettings, isLoading } = useAppState();

  // Show simple loading spinner only during initial auth check
  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // After initialization, handle settings check
  if (!hasSettings) {
    return (
      <AuthWrapper>
        <NoSettings />
      </AuthWrapper>
    );
  }

  return (
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
  );
};

