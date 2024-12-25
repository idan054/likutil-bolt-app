import type { DeliveryTestRequest } from '../../types/delivery';

const BASE_URL = 'https://api.likutil.co.il/api';

export const testDeliveryConnection = async (
  method: string,
  key: string
): Promise<boolean> => {
  try {
    const testData: DeliveryTestRequest = {
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
    };

    const response = await fetch(
      `${BASE_URL}/create-delivery?method=${method}&key=${key}&isConnectionTest=true`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(testData),
      }
    );

    if (!response.ok) {
      throw new Error('Connection test failed');
    }

    return true;
  } catch (error) {
    console.error('[delivery.api] Connection test failed:', error);
    return false;
  }
};
