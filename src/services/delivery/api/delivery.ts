import { DELIVERY } from '../../../config/api';
import { ApiError } from '../../api/types';
import type { 
  DeliveryTaskRequest, 
  DeliveryTaskResponse,
  DeliveryRequestParams 
} from '../types';

export const createDeliveryTask = async (
  request: DeliveryTaskRequest,
  params: DeliveryRequestParams
): Promise<DeliveryTaskResponse> => {
  // Use 'method' instead of 'Company' in the query params
  const url = `${DELIVERY.BASE_URL}/create-delivery?method=${params.provider}&key=${params.key}`;

  try {
    console.log('[delivery.api] Creating delivery task:', {
      url,
      request,
      provider: params.provider
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError({
        requestUrl: url,
        requestMethod: 'POST',
        requestHeaders: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        requestBody: request,
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseBody: data,
      });
    }

    return data;
  } catch (error) {
    console.error('[delivery.api] Failed to create delivery task:', error);
    throw error;
  }
};