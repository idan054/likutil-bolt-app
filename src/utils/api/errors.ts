import { toast } from 'react-hot-toast';
import { ApiError } from '../../services/api/types';

export const handleApiError = (error: unknown, context: string) => {
  // Log error with context for debugging
  console.error(`[${context}] API Error:`, error);

  if (error instanceof ApiError) {
    const { details } = error;
    
    // Handle network errors
    if (details.responseStatus === 0) {
      toast.error('שגיאת תקשורת. אנא בדוק את החיבור לאינטרנט ונסה שוב.', {
        id: `network-error-${context}`,
      });
      return;
    }

    // Handle specific API errors
    if (details.responseStatus === 401) {
      toast.error('אין הרשאה. אנא בדוק את פרטי ההתחברות.', {
        id: `auth-error-${context}`,
      });
      return;
    }

    // Handle other API errors
    toast.error(
      typeof details.responseBody === 'string' 
        ? details.responseBody 
        : 'שגיאה בתקשורת עם השרת',
      { id: `api-error-${context}` }
    );
  } else {
    // Handle generic errors
    toast.error('שגיאה לא צפויה. אנא נסה שוב.', {
      id: `generic-error-${context}`,
    });
  }
};