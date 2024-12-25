import { extractIntFromXml } from '../../../utils/xml/parser';

export const isSuccessfulDeliveryResponse = (responseBody: string): boolean => {
  const value = extractIntFromXml(responseBody);
  const isBaldarSucceeded = value !== null && value > 0; // Positive int
  const isLionWheelSucceeded = responseBody.includes('tracking_link');

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
