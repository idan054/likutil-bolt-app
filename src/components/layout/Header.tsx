import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { SystemAdvantages } from './advantages/SystemAdvantages';
import { Logo } from './Logo';
import { UserMenu } from '../auth/UserMenu';
import { SettingsModal } from '../settings/SettingsModal';
import { auth } from '../../config/firebase';
import { useSettings } from '../../hooks/useSettings';
import { useDebugAuth } from '../../hooks/useDebugAuth';

interface HeaderProps {
  isLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isLoading = false }) => {
  const [showAdvantages, setShowAdvantages] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [user] = useAuthState(auth);
  const { isEnabled: isDebugMode, mockUser } = useDebugAuth();
  const { settings, updateSettings } = useSettings();

  const toggleAdvantages = () => setShowAdvantages(prev => !prev);

  // Use debug user in development mode
  const currentUser = isDebugMode ? mockUser : user;

  return (
    <div className="mb-2">
      {/* User Menu */}
      {currentUser && (
        <div className="flex justify-end px-4 py-2 border-b">
          <UserMenu 
            user={currentUser} 
            onOpenSettings={() => setShowSettings(true)} 
          />
        </div>
      )}

      {/* Logo and Toggle */}
      <div className="flex justify-center items-center gap-1 mt-4">
        <ChevronDown 
          className={`text-gray-300 transition-transform duration-200 cursor-pointer ${
            showAdvantages ? 'transform rotate-180' : ''
          }`} 
          size={42}
          onClick={toggleAdvantages}
        />
        <Logo isLoading={isLoading} onClick={toggleAdvantages} />
      </div>
      
      {/* Advantages Section */}
      <div className={`transition-all duration-300 ${
        showAdvantages 
          ? 'max-h-[2000px] opacity-100' 
          : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <div className="max-w-4xl mx-auto pt-4 pb-2">
          <SystemAdvantages />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          initialData={settings || undefined}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};