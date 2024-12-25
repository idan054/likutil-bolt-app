import { ApiError, type ApiRequestConfig, type ApiResponse } from '../types';

export const makeRequest = async <T>({ method, path, body }: ApiRequestConfig): Promise<ApiResponse<T>> => {
  const config = await import('../config/settings').then(m => m.getApiConfig());
  
  if (!config) {
    throw new ApiError({
      requestUrl: path,
      requestMethod: method,
      requestHeaders: {},
      responseStatus: 0,
      responseStatusText: 'Configuration Error',
      responseBody: 'API configuration not available - please check your settings',
    });
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
      console.warn('[api.client] Failed to parse response as JSON:', responseText);
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

    return {
      data: parsedData,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    };
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