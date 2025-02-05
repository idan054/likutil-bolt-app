import { getApiConfig } from './config';
import { ApiError, type ApiRequestConfig } from './types';

export const apiClient = async <T>({ method, path, body}: ApiRequestConfig): Promise<T> => {
  // Get API configuration
  const config = getApiConfig();


    // Log full request details
    const requestDetails = {
      timestamp: new Date().toISOString(),
      method,
      path,
      headers: config?.headers,
      body: body || null,
      baseUrl: config?.baseUrl
    };

    
  if (!config) {
    console.error('[apiClient] Configuration error:', {
    
      timestamp: new Date().toISOString(),
      error: 'API configuration not available',
    });
    throw new Error(`API configuration not available - Method: ${method}, Path: ${path}. Full Details: ${requestDetails}`);
  }

  // console.info('[apiClient] Full request details:', requestDetails);

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