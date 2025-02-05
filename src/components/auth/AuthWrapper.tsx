import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';
import { LoginPage } from './LoginPage';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { SettingsModal } from '../settings/SettingsModal';
import { useSettings } from '../../hooks/useSettings';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user] = useAuthState(auth);
  const { settings, isLoading: isLoadingSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  // Only show settings modal for authenticated users without settings
  useEffect(() => {
    const currentUser =  user;
    const shouldShowSettings = currentUser && !isLoadingSettings && !settings;
    setShowSettings(shouldShowSettings ?? false);
  }, [user, settings, isLoadingSettings,]);

  // Handle initial auth loading
  if (!user) {
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
      {showSettings && (
        <SettingsModal
          initialData={settings || undefined}
          onClose={() => settings && setShowSettings(false)}
        />
      )}
    </>
  );
};