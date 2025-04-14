import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';
import { LoginPage } from './LoginPage';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useSettings } from '../../hooks/useSettings';
import { LoginPageV2 } from './LoginPageV2';


interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const { settings, isLoading: isLoadingSettings } = useSettings();
  
  // Skip auth check during user creation
  const isCreatingUser = sessionStorage.getItem('creating_user') === 'true';

  // Handle initial auth loading
  if (!user || isCreatingUser) {
    return <LoginPage />;
  }

  // Show loading spinner only during settings fetch
  if (isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      {children}
      {/* {showSettings && (
        <SettingsModal
          initialData={settings || undefined}
          onClose={() => settings && setShowSettings(false)}
        />
      )} */}
    </>
  );
};