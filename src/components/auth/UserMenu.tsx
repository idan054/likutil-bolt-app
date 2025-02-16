import React from 'react';
import { Settings } from 'lucide-react';
import type { User } from '../../types/auth';

interface UserMenuProps {
  user: User;
  onOpenSettings: () => void;
  storeUrl?: string;  // Add this prop
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onOpenSettings, storeUrl }) => (
  <div className="flex items-center gap-3">
    

    
    <span className="text-sm text-gray-700">
      {storeUrl || user.email}
    </span>

    <img
        // src={user.photoURL}
        src={`https://www.google.com/s2/favicons?domain=${storeUrl}&sz=64`}
        alt={user.displayName || 'User avatar'}
        className="w-8 h-8 rounded-full"
      />

    <button
      onClick={onOpenSettings}
      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
      title="הגדרות"
    >
      <Settings size={18} />
    </button>
  </div>
);