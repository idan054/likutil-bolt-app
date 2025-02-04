// Debug feature flags
export const DEBUG_CONFIG = {
  // Authentication
  AUTH: {
    ENABLED: false,           // Master switch for auth debugging
    WOO_CREDENTIALS: {
      STORE_URL: 'spider3d.co.il',
      CONSUMER_KEY: 'ck_05f6046c52108486eb869a377784ba50d3a6ebf6',
      CONSUMER_SECRET: 'cs_ff7af9474b569f67fbd24e48cf4226751cd05133'
    },
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