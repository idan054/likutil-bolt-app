import { ApiError } from '../../services/api/types';

interface RetryConfig {
  maxAttempts?: number;
  delayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const defaultConfig: Required<RetryConfig> = {
  maxAttempts: 3,
  delayMs: 1000,
  shouldRetry: (error) => {
    if (error instanceof ApiError) {
      // Retry on network errors or 5xx server errors
      return error.details.responseStatus === 0 || 
             error.details.responseStatus >= 500;
    }
    return false;
  },
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  config?: RetryConfig
): Promise<T> => {
  const { maxAttempts, delayMs, shouldRetry } = {
    ...defaultConfig,
    ...config,
  };

  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
};