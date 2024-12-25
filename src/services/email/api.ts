import { ApiError } from '../api/types';
import { formatDateWithTimeAgo } from '../../utils/date';

interface EmailData {
  subject: string;
  body: string;
  to_email: string;
}

export const sendEmail = async (request: EmailData): Promise<void> => {
  try {
    const response = await fetch('https://api.likutil.co.il/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new ApiError({
        requestUrl: 'send-email',
        requestMethod: 'POST',
        requestHeaders: { 'Content-Type': 'application/json' },
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseBody: await response.text(),
      });
    }
  } catch (error) {
    console.error('[email.api] Failed to send email:', error);
    throw error;
  }
};

export const sendDeliveryRequest = async (
  integration: { name: string },
  phone: string,
  userData: {
    createdAt?: string;
    connectedProviders: string[];
    storeUrl?: string;
  }
): Promise<void> => {
  const now = new Date();
  
  const emailData: EmailData = {
    subject: 'בקשת חיבור חדשה',
    body: `
      בקשת חיבור חדשה:
      חברת משלוחים: ${integration.name}
      טלפון ליצירת קשר: ${phone}

      פרטי המשתמש:
      ${userData.storeUrl ? `אתר: ${userData.storeUrl}` : ''}
      ${userData.createdAt ? `משתמש מתאריך: ${formatDateWithTimeAgo(userData.createdAt)}` : ''}
      חברות משלוחים מחוברות: ${userData.connectedProviders.length > 0 
        ? userData.connectedProviders.join(', ') 
        : 'אין'}

      נשלח בתאריך: ${formatDateWithTimeAgo(now.toISOString())}
      נשלח מ: ליקוטיל
    `,
    to_email: 'idanbit80@gmail.com'
  };

  await sendEmail(emailData);
};