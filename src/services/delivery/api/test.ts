import { ApiError } from '../../api/types';
import { DeliveryTestRequest } from '../../../types/delivery';
import {
  isSuccessfulDeliveryResponse,
  getDeliveryErrorCode,
  getDeliveryErrorMessage,
} from '../validation/response';

const BASE_URL = 'https://api.likutil.co.il/api';

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
  method: string,
  key: string
): Promise<DeliveryTestResult> => {
  try {
    // Use 'method' instead of 'Company' in the query params
    const response = await fetch(
      `${BASE_URL}/create-delivery?method=${method}&key=${key}&isConnectionTest=true`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(createTestRequest()),
      }
    );

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
      requestUrl: `${BASE_URL}/create-delivery?method=${method}&key=${key}&isConnectionTest=true`,
      requestMethod: 'POST',
      requestBody: JSON.stringify(createTestRequest()),
      requestHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      responseStatus: response.status,
      responseStatusText: response.statusText,
      responseBody: responseText,
    });
  } catch (error) {
    console.error('[delivery.api.test] Connection test failed:', error);
    throw error;
  }
};
