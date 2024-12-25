import { useState, useEffect } from 'react';
import { networkStatus } from '../utils/network/status';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(networkStatus.isOnline());

  useEffect(() => {
    return networkStatus.addListener(setIsOnline);
  }, []);

  return isOnline;
};