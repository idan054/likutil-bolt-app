import { extractIntFromXml } from '../../../utils/xml/parser';
import type { DeliveryTaskResponse } from '../types';

export type PrintLabelSource = {
  type: 'url' | 'base64';
  value: string;
};

export const getPrintLabelSource = (printLabel: unknown): PrintLabelSource | null => {
  if (typeof printLabel !== 'string' || !printLabel.trim()) {
    return null;
  }

  const value = printLabel.trim();

  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return { type: 'url', value: url.toString() };
    }
  } catch {
    // A non-URL value may still be a base64-encoded PDF.
  }

  const base64Value = value
    .replace(/^data:application\/pdf;base64,/i, '')
    .replace(/\s+/g, '');

  const isPdfBase64 =
    base64Value.startsWith('JVBERi0') &&
    base64Value.length % 4 === 0 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(base64Value);

  return isPdfBase64 ? { type: 'base64', value: base64Value } : null;
};

export const isValidDeliveryTaskResponse = (
  response: unknown
): response is DeliveryTaskResponse => {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const candidate = response as Record<string, unknown>;
  const hasProviderError =
    typeof candidate.error_text === 'string' && candidate.error_text.trim().length > 0;

  return !hasProviderError && getPrintLabelSource(candidate.print_label) !== null;
};

export const isSuccessfulDeliveryResponse = (responseBody: string): boolean => {
  const value = extractIntFromXml(responseBody);
  const isBaldarSucceeded = value !== null && value > 0; // Positive int
  const isLionWheelSucceeded = responseBody.includes('tracking_link') || responseBody.includes('provider');

  return isBaldarSucceeded || isLionWheelSucceeded;
};

export const getDeliveryErrorCode = (responseBody: string): number | null => {
  const value = extractIntFromXml(responseBody);
  return value !== null && value < 0 ? value : null;
};

export const getDeliveryErrorMessage = (errorCode: number): string => {
  switch (errorCode) {
    case -999:
      return 'שגיאת חיבור מסוג -999, אנה פנה לתמיכה 0584770076';
    case -100:
      return 'שגיאת חיבור מסוג -100, אנה פנה לתמיכה 0584770076';
    default:
      return 'שגיאת חיבור מסוג לא מוכר, אנה פנה לתמיכה 0584770076';
  }
};
