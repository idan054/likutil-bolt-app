import { useCallback } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { handleAuthError } from '../utils/auth';
import { toast } from 'react-hot-toast';
import { useDebugAuth } from './useDebugAuth';
import type { User } from '../types/auth';

export const useAuth = () => {
  const { isEnabled: isDebugEnabled, mockUser } = useDebugAuth();

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    // In debug mode, return the debug user immediately
    if (isDebugEnabled) {
      toast.success('התחברת בהצלחה! (מצב פיתוח)', {
        id: 'auth-success-debug',
      });
      return mockUser as User;
    }

    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        toast.success('התחברת בהצלחה!', {
          id: 'auth-success',
        });
        return result.user;
      }
      
      return null;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  }, [isDebugEnabled, mockUser]);

  const logout = useCallback(async () => {
    if (isDebugEnabled) {
      toast.success('התנתקת בהצלחה! (מצב פיתוח)', {
        id: 'logout-success-debug',
      });
      return;
    }

    try {
      await signOut(auth);
      toast.success('התנתקת בהצלחה!', {
        id: 'logout-success',
      });
    } catch (error) {
      handleAuthError(error);
    }
  }, [isDebugEnabled]);

  return {
    signInWithGoogle,
    logout,
  };
};