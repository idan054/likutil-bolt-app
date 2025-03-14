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
      <a

      // 
    href="https://wa.me/972557113987" // Replace with your actual WhatsApp number
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center px-4 py-2 hover:text-blue-500 text-gray-500 rounded-lg transition-colors shadow-sm gap-2"
  >

לתמיכה
    

    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.5893 11.9226L14.5818 11.9851C12.7493 11.0717 12.5576 10.9501 12.321 11.3051C12.1568 11.5509 11.6785 12.1084 11.5343 12.2734C11.3885 12.4359 11.2435 12.4484 10.996 12.3359C10.746 12.2109 9.94344 11.9484 8.99343 11.0984C8.25342 10.4359 7.75675 9.62338 7.61008 9.37338C7.36591 8.95171 7.87675 8.89171 8.34176 8.0117C8.42509 7.83669 8.38259 7.69919 8.32092 7.57502C8.25842 7.45002 7.76092 6.22501 7.55258 5.73667C7.35258 5.25 7.14674 5.31167 6.99258 5.31167C6.51257 5.27 6.16173 5.27667 5.85256 5.59834C4.50755 7.07669 4.84672 8.6017 5.99757 10.2234C8.25926 13.1834 9.46427 13.7284 11.6676 14.4851C12.2626 14.6743 12.8051 14.6476 13.2343 14.5859C13.7127 14.5101 14.7068 13.9851 14.9143 13.3976C15.1268 12.8101 15.1268 12.3226 15.0643 12.2101C15.0027 12.0976 14.8393 12.0351 14.5893 11.9226Z" fill="#6B7280"/>
<path d="M17.1002 2.87397C10.6926 -3.32026 0.0883343 1.17229 0.0841676 9.91072C0.0841676 11.6574 0.541673 13.3608 1.41335 14.8649L0 20L5.27923 18.6233C11.8668 22.1817 19.9969 17.4566 20.0002 9.91572C20.0002 7.26902 18.9669 4.77816 17.0877 2.90647L17.1002 2.87397ZM18.3352 9.88822C18.3302 16.2491 11.3476 20.2217 5.82507 16.975L5.52506 16.7966L2.40003 17.6091L3.23754 14.5716L3.03837 14.2591C-0.398338 8.78821 3.55004 1.63812 10.0601 1.63812C11.1473 1.63539 12.2242 1.84831 13.2285 2.26457C14.2328 2.68083 15.1446 3.29215 15.911 4.06315C16.6816 4.82448 17.2929 5.73168 17.7091 6.7318C18.1254 7.73193 18.3382 8.80494 18.3352 9.88822Z" fill="#6B7280"/>
</svg>



    
    
  </a>
      </div>
    </a>

    <a 
      className="group flex items-center hover:opacity-80 transition-all duration-300"
    >
      
      <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden mr-1 hover:border-blue-500 transition-all duration-300 transform hover:scale-110 mr-2">
        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
          title="הגדרות"
        >
          <Settings size={19} />
          {/* <img
          src="/assets/svg/truck_settings.svg"
          alt="WooCommerce Logo"
          className="h-8 transition-transform group-hover:scale-110"
        /> */}
        </button>
      </div>
    </a>
  </div>
)};