import { type FirebaseError } from 'firebase/app';
import { toast } from 'react-hot-toast';

const TOAST_DURATION = 5000;

export const handleAuthError = (error: unknown) => {
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as FirebaseError;
    
    switch (firebaseError.code) {
      case 'auth/unauthorized-domain':
        toast.error('הדומיין הנוכחי אינו מורשה. אנא פנה למנהל המערכת.', {
          duration: TOAST_DURATION,
          id: 'unauthorized-domain',
        });
        console.error('[auth.utils] Unauthorized domain. Please add this domain to Firebase Console > Authentication > Settings > Authorized domains');
        break;
      case 'auth/popup-blocked':
        toast.error('החלון הקופץ נחסם. אנא אפשר חלונות קופצים ונסה שוב.', {
          duration: TOAST_DURATION,
          id: 'popup-blocked',
        });
        break;
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        // Don't show error for user-initiated cancellation
        break;
      case 'auth/account-exists-with-different-credential':
        toast.error('כבר קיים חשבון עם כתובת האימייל הזו. נסה להתחבר בדרך אחרת.', {
          duration: TOAST_DURATION,
          id: 'account-exists',
        });
        break;
      case 'auth/network-request-failed':
        toast.error('שגיאת תקשורת. אנא בדוק את החיבור לאינטרנט ונסה שוב.', {
          duration: TOAST_DURATION,
          id: 'network-error',
        });
        break;
      case 'auth/invalid-credential':
        // Handle silently as we'll retry with generated password
        console.log('[auth.utils] Invalid credential, will retry with generated password');
        break;
      default:
        console.error('[auth.utils] Authentication error:', firebaseError);
        toast.error('שגיאה בהתחברות. אנא נסה שוב.', {
          duration: TOAST_DURATION,
          id: 'auth-error',
        });
    }
  } else {
    console.error('[auth.utils] Unknown error:', error);
    toast.error('שגיאה לא צפויה. אנא נסה שוב.', {
      duration: TOAST_DURATION,
      id: 'unknown-error',
    });
  }
};

// Generate consistent password based on email
export const generateUserPassword = (email: string): string => {
  const cleanEmail = email.toLowerCase().trim();
  const salt = 'likutil-v1';
  return `${cleanEmail}-${salt}`;
};