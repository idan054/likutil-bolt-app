import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogOut } from 'lucide-react';
import { auth } from '../../../config/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { USE_DEBUG_AUTH, DEBUG_USER } from '../../../config/constants';

export const UserProfile: React.FC = () => {
  const [user] = useAuthState(auth);
  const { logout } = useAuth();
  
  const currentUser = USE_DEBUG_AUTH ? DEBUG_USER : user;
  
  if (!currentUser) return null;

  return (
    <div className="text-center">
      {/* Profile Section - Flex on mobile */}
      <div className="flex sm:flex-col items-center gap-3">
        {/* Profile Image - Centered on desktop */}
        <div className="shrink-0 sm:mx-auto">
          <img
            src={currentUser.photoURL || 'https://www.gravatar.com/avatar?d=mp'}
            alt={currentUser.displayName || 'User avatar'}
            className="w-12 h-12 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-lg"
          />
        </div>

        {/* User Info - Aligned left on mobile, centered on desktop */}
        <div className="text-right sm:text-center sm:mt-4">
          <h3 className="text-base sm:text-lg font-semibold">
            {currentUser.displayName}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 break-words">
            {currentUser.email}
          </p>
        </div>
      </div>

      {/* Logout Button - Smaller on mobile */}
      <button
        onClick={logout}
        className="mt-2 sm:mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm sm:text-base"
      >
        <LogOut size={16} className="sm:w-5 sm:h-5" />
        <span>התנתק</span>
      </button>
    </div>
  );
};