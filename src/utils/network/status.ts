// Network status tracking
let isOnline = navigator.onLine;

const listeners = new Set<(online: boolean) => void>();

export const networkStatus = {
  isOnline: () => isOnline,
  
  addListener: (callback: (online: boolean) => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
  
  notifyListeners: (online: boolean) => {
    isOnline = online;
    listeners.forEach(listener => listener(online));
  }
};

// Listen for online/offline events
window.addEventListener('online', () => networkStatus.notifyListeners(true));
window.addEventListener('offline', () => networkStatus.notifyListeners(false));