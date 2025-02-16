import React from 'react';
import { Settings } from 'lucide-react';
import type { User } from '../../types/auth';

interface UserMenuProps {
  user: User;
  onOpenSettings: () => void;
  storeUrl?: string;  // Add this prop
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onOpenSettings, storeUrl }) => {
  // const handleStoreClick = (e: React.MouseEvent) => {
  //   e.preventDefault();
  //   if (storeUrl) {
  //     window.open(`https://${storeUrl}`, '_blank', 'noopener,noreferrer');
  //   }
  // };

  return (
    <div className="flex items-center gap-0">
      <a 
        href={`https://${storeUrl}`}
        // onClick={handleStoreClick}
        className="group flex items-center hover:opacity-80 transition-all duration-300"
      >
        <div className="h-10 rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden ml-1 hover:border-blue-500 transition-all duration-300 transform hover:scale-110">
          <span className="text-sm font-medium text-gray-700 truncate max-w-[150px] group-hover:text-blue-600 transition-colors pr-3">
            {storeUrl || user.email}
          </span>
          <img
            src={`https://www.google.com/s2/favicons?domain=${storeUrl}&sz=64`}
            alt={user.displayName || 'User avatar'}
            className="h-full object-cover p-2 pl-3"
          />
        </div>
      </a>

    <a 
      className="group flex items-center hover:opacity-80 transition-all duration-300"
    >
      <div className="w-9.5 h-9.5 rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden mr-1 hover:border-blue-500 transition-all duration-300 transform hover:scale-110">
        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
          title="הגדרות"
        >
          <Settings size={18} />
        </button>
      </div>
    </a>
  </div>
)};