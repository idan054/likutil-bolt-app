import {
  disableNetwork,
  enableNetwork,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { networkStatus } from '../network/status';
import { toast } from 'react-hot-toast';

let isInitialized = false;

export const initializeFirebaseOffline = async () => {
  if (isInitialized) return;
  isInitialized = true;

  networkStatus.addListener(async (online) => {
    try {
      if (online) {
        await enableNetwork(db);
        console.log('[firebase.offline] Network connection restored');
      } else {
        await disableNetwork(db);
        console.log('[firebase.offline] Switched to offline mode');
        toast.error('אין חיבור לאינטרנט. המערכת לא תעבוד במצב לא מקוון', {
          id: 'offline-mode',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('[firebase.offline] Network mode switch failed:', error);
    }
  });
};
