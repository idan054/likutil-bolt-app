import { toast } from 'react-hot-toast';
import { ApiError } from '../services/api/types';

const TOAST_DURATION = 5000;

export const showErrorToast = (error: unknown) => {
  if (error instanceof ApiError) {
    const { details } = error;
    
    // For network errors
    if (details.responseStatus === 0) {
      toast.error('שגיאת תקשורת. אנא בדוק את החיבור לאינטרנט ונסה שוב.', {
        duration: TOAST_DURATION,
        id: 'network-error',
      });
      return;
    }

    // For API errors
    const errorMessage = typeof details.responseBody === 'string' 
      ? details.responseBody
      : details.responseBody?.message || 'שגיאה לא צפויה';

    toast.error(errorMessage, {
      duration: TOAST_DURATION,
      id: 'api-error',
    });

    // Log full error details to console for debugging
    console.error('[error.utils] API Error:', {
      url: details.requestUrl,
      method: details.requestMethod,
      status: details.responseStatus,
      response: details.responseBody,
    });
  } else {
    // For generic errors
    const errorMessage = error instanceof Error ? error.message : 'שגיאה לא צפויה';
    toast.error(errorMessage, {
      duration: TOAST_DURATION,
      id: 'generic-error',
    });
    console.error('[error.utils] Generic Error:', error);
  }
};