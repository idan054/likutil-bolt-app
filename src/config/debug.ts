// Debug feature flags
export const DEBUG_CONFIG = {
  // Authentication
  AUTH: {
    ENABLED: false,           // Master switch for auth debugging
    AUTO_LOGIN: false,        // Automatically log in with debug user
    MOCK_USER: {
      uid: 'debug-user-123',
      email: 'debug@example.com',
      displayName: 'Debug User',
      photoURL: 'https://www.gravatar.com/avatar?d=mp'
    }
  },
  
  // Logging
  LOGGING: {
    ENABLED: true,           // Enable debug logging
    AUTH_EVENTS: true,       // Log authentication events
    API_CALLS: true         // Log API calls
  }
} as const;

// Helper to check if we're in development environment
export const IS_DEV = import.meta.env.DEV;

// Utility to check if a debug feature is enabled
export const isDebugEnabled = (feature: keyof typeof DEBUG_CONFIG): boolean => {
  return IS_DEV && DEBUG_CONFIG[feature].ENABLED;
};