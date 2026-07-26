import { ApiError } from '../../api/types';
import { BASE_URL } from '../../auth/woo-auth.ts';
import { DeliveryTestRequest } from '../../../types/delivery';
import {
  isSuccessfulDeliveryResponse,
  getDeliveryErrorCode,
  getDeliveryErrorMessage,
} from '../validation/response';



const createTestRequest = (): DeliveryTestRequest => ({
  pack_num: '1',
  id: '000000',
  number: '000000',
  date_created: '2003-01-03',
  customer_note: '',
  shipping: {
    address_1: 'ויצמן 90',
    address_2: '',
    city: 'תל אביב',
    first_name: 'לא',
    last_name: 'לשלוח',
  },
  billing: {
    email: 'idanbit80@gmail.com',
    phone: '0584770076',
  },
  business: {
    address: 'ויצמן 91',
    city: 'תל אביב',
    name: 'בדיקת בלבד!',
  },
});

export interface DeliveryTestResult {
  success: boolean;
  errorCode?: number;
  errorMessage?: string;
}

export const testDeliveryConnection = async (
  provider: string,
  keys: string,
  userId: string
): Promise<DeliveryTestResult> => {
  try {
    const query = new URLSearchParams({
      userId,
      provider,
      keys,
      isConnectionTest: 'true',
    });
    const url = `${BASE_URL}/api/create-delivery?${query.toString()}`;
    const safeUrl = `${BASE_URL}/api/create-delivery?provider=${encodeURIComponent(provider)}&isConnectionTest=true`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(createTestRequest()),
    });

    const responseText = await response.text();

    if (isSuccessfulDeliveryResponse(responseText)) {
      return { success: true };
    }

    const errorCode = getDeliveryErrorCode(responseText);
    if (errorCode) {
      return {
        success: false,
        errorCode,
        errorMessage: getDeliveryErrorMessage(errorCode),
      };
    }

    throw new ApiError({
      requestUrl: safeUrl,
      requestMethod: 'POST',
      requestBody: { provider, isConnectionTest: true },
      requestHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      responseStatus: response.status,
      responseStatusText: response.statusText,
      responseBody: responseText,
    });
  } catch (error) {
    console.error('[delivery.api.test] Connection test failed:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown delivery test error',
    });
    throw error;
  }
};
