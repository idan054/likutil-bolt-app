import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { BASE_URL } from '../../services/auth/woo-auth';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <WifiOff size={20} />
      <span>מצב לא מקוון</span>
    </div>
  );
};

export const ServerOfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch(BASE_URL);
        setIsOnline(response.ok);
      } catch (error) {
        console.log('Failed to check server status: ', error);
        setIsOnline(false);
      }
      setLastChecked(new Date());
    };

    // Initial check
    checkServerStatus();

    // Set up periodic checks every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <WifiOff size={20} />
      <span>אין חיבור לשרת</span>
    </div>
  );
};