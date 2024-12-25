import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const SignInButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleSignIn = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="group relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-700 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
    >
      <img 
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
        alt="Google Logo" 
        className="w-6 h-6 transition-transform group-hover:scale-110"
      />
      <span className="font-medium">
        {isLoading ? 'מתחבר...' : 'התחבר עם Google'}
      </span>
      {isLoading && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
      )}
    </button>
  );
};