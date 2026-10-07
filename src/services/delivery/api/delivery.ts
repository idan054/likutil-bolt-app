import { ApiError } from '../../api/types';
import { BASE_URL } from '../../auth/woo-auth.ts';
import { auth } from '../../../config/firebase';
import type { ShipmentState } from '../types';

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

export class ShipmentBlockedError extends Error {
  constructor(public shipment: ShipmentState) {
    super(shipment.message);
    this.name = 'ShipmentBlockedError';
  }
}

const authHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('יש להתחבר מחדש לליקוטיל לפני יצירת משלוח.');
  return { ...requestHeaders, Authorization: `Bearer ${token}` };
};

export const getShipmentState = async (orderId: string, userId: string): Promise<ShipmentState> => {
  const query = new URLSearchParams({ orderId, userId });
  const response = await fetch(`${BASE_URL}/api/delivery-status?${query}`, {
    headers: await authHeaders(), cache: 'no-store', signal: AbortSignal.timeout(20_000),
  }).catch(() => { throw new Error('בעיית תקשורת עם שירות המשלוחים. לא ניתן לבדוק כרגע אם קיים משלוח. אפשר לבדוק שוב או לבחור במפורש הפקת משלוח חדש.'); });
  const data = await response.json().catch(() => { throw new Error('שירות המשלוחים החזיר תשובה לא תקינה. מצב המשלוח אינו ידוע. אפשר לבדוק שוב או לבחור במפורש הפקת משלוח חדש.'); });
  if (!response.ok || typeof data.blocked !== 'boolean') {
    throw new Error(typeof data.detail === 'string' ? data.detail : 'לא ניתן לבדוק אם כבר קיים משלוח. יצירה נוספת חסומה עד לחידוש החיבור.');
  }
  return data;
};

export const cancelDeliveryShipment = async (
  orderId: string, userId: string, shipment: DeliveryTaskResponse, revision: string
): Promise<ShipmentState> => {
  const query = new URLSearchParams({orderId, userId, provider: shipment.provider,
    trackNumber: String(shipment.track_number), revision});
  const response = await fetch(`${BASE_URL}/api/cancel-delivery?${query}`, {
    method: 'POST', headers: await authHeaders(), signal: AbortSignal.timeout(90_000),
  }).catch(() => { throw new Error('בעיית תקשורת בזמן הביטול. לא ידוע אם המשלוח בוטל. אפשר לבדוק שוב את מצבו.'); });
  const data = await response.json();
  if (!response.ok) {
    if (data.detail && typeof data.detail === 'object' && data.detail.blocked) {
      throw new ShipmentBlockedError(data.detail);
    }
    throw new Error(typeof data.detail === 'string' ? data.detail : 'לא התקבל אישור ביטול. יש לבדוק מצב משלוח.');
  }
  if (typeof data.blocked !== 'boolean' || !Array.isArray(data.shipments)) {
    throw new Error('לא התקבל אישור ביטול תקין. יש לבדוק מצב משלוח.');
  }
  return data;
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
  if (params.additionalShipmentRevision) query.set('additionalShipmentRevision', params.additionalShipmentRevision);
  if (params.replacementShipmentRevision) query.set('replacementShipmentRevision', params.replacementShipmentRevision);
  const url = `${BASE_URL}/api/create-delivery?${query.toString()}`;
  const safeUrl = `${BASE_URL}/api/create-delivery?provider=${encodeURIComponent(params.provider)}`;
  const safeRequestBody = { orderId: request.id, provider: params.provider };

  try {
    console.log('[delivery.api] Creating delivery task:', safeRequestBody);

    const response = await fetch(url, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(90_000),
    }).catch(() => { throw new Error('בעיית תקשורת בזמן הפקת המשלוח. לא ידוע אם ההפקה הצליחה. אפשר לבדוק מצב משלוח או לבחור במפורש הפקה חדשה.'); });

    const responseText = await response.text();
    let data: unknown = responseText;

    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      // Keep the raw response text for a useful, credential-safe error message.
    }

    if (!response.ok) {
      const detail = data && typeof data === 'object' ? (data as Record<string, unknown>).detail : null;
      if (detail && typeof detail === 'object' && typeof (detail as ShipmentState).blocked === 'boolean') {
        throw new ShipmentBlockedError(detail as ShipmentState);
      }
      throw new ApiError({
        requestUrl: safeUrl,
        requestMethod: 'POST',
        requestHeaders,
        requestBody: safeRequestBody,
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseBody: typeof detail === 'string' ? { message: detail } : data,
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
