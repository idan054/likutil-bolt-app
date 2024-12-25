import { CONSUMER_KEY, CONSUMER_SECRET } from '../config/constants';

export const createAuthHeader = () => {
  const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
  return `Basic ${auth}`;
};

export const handleApiError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  return new Error('An unexpected error occurred');
};