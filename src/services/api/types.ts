export interface ApiConfig {
  baseUrl: string;
  headers: {
    Authorization: string;
    'Content-Type': string;
    Accept: string;
  };
}

export interface ApiRequestConfig {
  method: string;
  path: string;
  body?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface ApiErrorDetails {
  requestUrl: string;
  requestMethod: string;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  responseStatus: number;
  responseStatusText: string;
  responseBody: unknown;
}

export class ApiError extends Error {
  details: ApiErrorDetails;

  constructor(details: ApiErrorDetails) {
    super(`API Request Failed: ${details.responseStatusText}`);
    this.name = 'ApiError';
    this.details = details;
  }
}