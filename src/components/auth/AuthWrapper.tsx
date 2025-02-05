import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';
import { LoginPage } from './LoginPage';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { SettingsModal } from '../settings/SettingsModal';
import { useSettings } from '../../hooks/useSettings';
import { useDebugAuth } from '../../hooks/useDebugAuth';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user] = useAuthState(auth);
  const { isEnabled: isDebugMode, mockUser } = useDebugAuth();
  const { settings, isLoading: isLoadingSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  // Only show settings modal for authenticated users without settings
  useEffect(() => {
    const currentUser = isDebugMode ? mockUser : user;
    const shouldShowSettings = currentUser && !isLoadingSettings && !settings;
    setShowSettings(shouldShowSettings);
  }, [user, settings, isLoadingSettings, isDebugMode, mockUser]);

  // Handle initial auth loading
  if (!user && !isDebugMode) {
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