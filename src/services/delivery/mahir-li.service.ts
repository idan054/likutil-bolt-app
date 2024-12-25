import { MAHIR_LI } from '../../config/constants';
import type { MahirLiRequest, MahirLiResponse } from './types';
import type { OrderDetails } from '../../types/order';
import { ApiError } from '../api/types';

const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const extractAddressNumber = (address: string): string => {
  const match = address.match(/\d+/);
  return match ? match[0] : '';
};

const extractStreetName = (address: string): string => {
  return address.replace(/\d+/g, '').trim();
};

export const createMahirLiDelivery = async (order: OrderDetails): Promise<MahirLiResponse> => {
  console.log('[mahir-li.service] Creating delivery for order:', order);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const request: MahirLiRequest = {
    pickup_at: formatDate(tomorrow),
    original_order_id: order.id.toString(),
    notes: `Order #${order.id}`,
    packages_quantity: order.line_items.length.toString(),
    destination_city: order.billing.city,
    destination_street: extractStreetName(order.billing.address_1),
    destination_number: extractAddressNumber(order.billing.address_1),
    destination_floor: '',
    destination_apartment: '',
    destination_notes: `מס' הזמנה: #${order.id}`,
    destination_recipient_name: `${order.billing.first_name} ${order.billing.last_name}`,
    destination_phone: order.billing.phone || '',
    destination_email: order.billing.email || '',
  };

  console.log('[mahir-li.service] Sending request:', {
    url: `${MAHIR_LI.BASE_URL}/tasks/create`,
    request
  });

  try {
    const response = await fetch(
      `${MAHIR_LI.BASE_URL}/tasks/create?key=${MAHIR_LI.API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
        mode: 'cors',
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[mahir-li.service] API error:', {
        status: response.status,
        statusText: response.statusText,
        data
      });

      throw new ApiError({
        requestUrl: `${MAHIR_LI.BASE_URL}/tasks/create`,
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

    console.log('[mahir-li.service] Delivery created successfully:', data);
    return data;
  } catch (error) {
    console.error('[mahir-li.service] Failed to create delivery:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError({
      requestUrl: `${MAHIR_LI.BASE_URL}/tasks/create`,
      requestMethod: 'POST',
      requestHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      requestBody: request,
      responseStatus: 0,
      responseStatusText: 'Network Error',
      responseBody: error instanceof Error ? error.message : 'Failed to create delivery',
    });
  }
};