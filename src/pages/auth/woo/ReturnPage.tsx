import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleWooAuthCallback } from '../../../services/auth/woo-auth';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export const WooAuthReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');

  useEffect(() => {
    const processAuth = async () => {
      if (!code) {
        toast.error('קוד אימות חסר');
        navigate('/');
        return;
      }

      const toastId = 'woo-auth';
      toast.loading('מתחבר...', { id: toastId });

      try {
        await handleWooAuthCallback(code);
        toast.success('התחברת בהצלחה!', { id: toastId });
        navigate('/');
      } catch (error) {
        console.error('[WooAuthReturnPage] Auth failed:', error);
        toast.error('שגיאה בהתחברות', { id: toastId });
        navigate('/');
      }
    };

    processAuth();
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
};