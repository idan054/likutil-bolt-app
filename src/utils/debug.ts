import { DEBUG_CONFIG, IS_DEV } from '../config/debug';

// Debug logging utility
export const debugLog = (
  category: string,
  message: string,
  data?: unknown
): void => {
  if (!IS_DEV || !DEBUG_CONFIG.LOGGING.ENABLED) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${category}]`;

  if (data) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
};