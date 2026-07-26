import { ApiError } from '../../api/types';
import { BASE_URL } from '../../auth/woo-auth.ts';

import type { 
  DeliveryTaskRequest, 
  DeliveryTaskResponse,
  DeliveryRequestParams 
} from '../types';
import { isValidDeliveryTaskResponse } from '../validation/response';

const requestHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export const createDeliveryTask = async (
  request: DeliveryTaskRequest,
  params: DeliveryRequestParams
): Promise<DeliveryTaskResponse> => {
  const query = new URLSearchParams({
    userId: params.userId,
    provider: params.provider,
    keys: params.keys,
  });
  const url = `${BASE_URL}/api/create-delivery?${query.toString()}`;
  const safeUrl = `${BASE_URL}/api/create-delivery?provider=${encodeURIComponent(params.provider)}`;
  const safeRequestBody = { orderId: request.id, provider: params.provider };

  try {
    console.log('[delivery.api] Creating delivery task:', safeRequestBody);

    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(request),
    });

    const responseText = await response.text();
    let data: unknown = responseText;

    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      // Keep the raw response text for a useful, credential-safe error message.
    }

    if (!response.ok) {
      throw new ApiError({
        requestUrl: safeUrl,
        requestMethod: 'POST',
        requestHeaders,
        requestBody: safeRequestBody,
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseBody: data,
      });
    }

    const providerError =
      data && typeof data === 'object' && typeof (data as Record<string, unknown>).error_text === 'string'
        ? String((data as Record<string, unknown>).error_text).trim()
        : '';

    if (providerError || !isValidDeliveryTaskResponse(data)) {
      throw new ApiError({
        requestUrl: safeUrl,
        requestMethod: 'POST',
        requestHeaders,
        requestBody: safeRequestBody,
        responseStatus: response.status,
        responseStatusText: providerError ? 'Delivery provider rejected request' : 'Invalid delivery response',
        responseBody: {
          message: providerError || 'חברת המשלוחים לא החזירה מדבקת PDF תקינה. המשלוח לא סומן כהצלחה.',
        },
      });
    }

    return data;
  } catch (error) {
    console.error('[delivery.api] Failed to create delivery task:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown delivery error',
    });
    throw error;
  }
};
