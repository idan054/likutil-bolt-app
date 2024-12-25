// Environment & Debug Settings
export const IS_DEBUG = import.meta.env.DEV;
export const USE_DEBUG_AUTH = IS_DEBUG;

// Debug user data
export const DEBUG_USER = {
  uid: 'debug-user-123',
  email: 'debug@example.com',
  displayName: 'Debug User',
  photoURL: 'https://wwfgifts-files.worldwildlife.org/wwfgifts/images/capuchin-monkey-large-photo.jpg',
} as const;

// Firebase Config
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDZ609tpVpSrWfOKVHVoyo9DK8dbYqAtRE",
  authDomain: "likutil.firebaseapp.com",
  projectId: "likutil",
  storageBucket: "likutil.firebasestorage.app",
  messagingSenderId: "314662541049",
  appId: "1:314662541049:web:9e6efa3430e1be4f47f428",
  measurementId: "G-VYRKS8Z4EX"
} as const;

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  SETTINGS: 'settings',
} as const;