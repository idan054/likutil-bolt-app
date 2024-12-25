import { getApiConfig } from './config';
import { ApiError, type ApiRequestConfig } from './types';

export const apiClient = async <T>({ method, path, body }: ApiRequestConfig): Promise<T> => {
  const config = getApiConfig();
  if (!config) {
    throw new Error('API configuration not available');
  }

  const { baseUrl, headers } = config;
  const url = `${baseUrl}${path}`;

  try {
    const response = await fetch(url, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
      mode: 'cors',
      cache: 'no-cache',
      referrerPolicy: 'no-referrer',
    });

    let parsedData;
    const responseText = await response.text();
    
    try {
      parsedData = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.warn('[apiClient] Failed to parse response as JSON:', responseText);
      parsedData = responseText;
    }

    if (!response.ok) {
      throw new ApiError({
        requestUrl: url,
        requestMethod: method,
        requestHeaders: headers,
        requestBody: body,
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseBody: parsedData,
      });
    }

    return parsedData;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError({
      requestUrl: url,
      requestMethod: method,
      requestHeaders: headers,
      requestBody: body,
      responseStatus: 0,
      responseStatusText: 'Network Error',
      responseBody: error instanceof Error ? error.message : 'Failed to fetch',
    });
  }
};