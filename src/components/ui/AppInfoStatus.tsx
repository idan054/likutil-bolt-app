import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { APP_VERSION } from '../../App';
import { BASE_URL } from '../../services/auth/woo-auth';

interface AppInfoStatusProps {
  apiEndpoint?: string;
}

export const AppInfoStatus: React.FC<AppInfoStatusProps> = ({ 
  
  apiEndpoint = BASE_URL
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch(apiEndpoint);
        setIsOnline(response.ok);
      } catch (error) {
        setIsOnline(false);
      }
      setLastChecked(new Date());
    };

    // Initial check
    checkServerStatus();

    // Set up periodic checks every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);

    return () => clearInterval(interval);
  }, [apiEndpoint]);

  return (
    <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mt-4">
      <div className="flex items-center gap-1">
        <a 
          href={BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-blue-500 transition-colors"
        >
          {isOnline ? (
            <CheckCircle className="w-3 h-3 text-green-500" />
          ) : (
            <XCircle className="w-3 h-3 text-red-500" />
          )}
          <span>{isOnline ? 'Online' : 'Offline'} {BASE_URL.includes('test') ? '(Tests)' : ''}</span>
        </a>
      </div>
      <span>•</span>
      <span>{APP_VERSION}</span>
    </div>
  );
};