import React from 'react';
import { Settings } from 'lucide-react';
import type { User } from '../../types/auth';

interface UserMenuProps {
  user: User;
  onOpenSettings: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onOpenSettings }) => (
  <div className="flex items-center gap-3">
    {user.photoURL && (
      <img
        src={user.photoURL}
        alt={user.displayName || 'User avatar'}
        className="w-8 h-8 rounded-full"
      />
    )}
    <span className="text-sm text-gray-700">
      {user.displayName || user.email}
    </span>
    <button
      onClick={onOpenSettings}
      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
      title="הגדרות"
    >
      <Settings size={18} />
    </button>
  </div>
);