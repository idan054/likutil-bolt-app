import { settingsStorage } from "../settings";
import { getApiConfig } from "./config";
import { ApiError, type ApiRequestConfig } from "./types";

// Unified apiClient to handle both WooCommerce and Shopify
export const apiClient = async <T>({
  method,
  path,
  body,
}: ApiRequestConfig): Promise<T> => {
  const config = getApiConfig(); // Retrieve API configuration based on platform
  const settings = settingsStorage.get();

  if (!config) {
    throw new Error("API configuration not available.");
  }

  const { baseUrl, headers, platform } = config;

  // 👇 Build final URL (use proxy only if it's a WooCommerce API path)
const targetUrl = `${baseUrl}${path}`;
const isWooRequest =
  platform === "woo" && targetUrl.includes("/wp-json/wc/");


  
const url = isWooRequest
  // ? `https://proxy.corsfix.com/?${encodeURIComponent(targetUrl)}`
  ? targetUrl
  : targetUrl;

  // Setup headers dynamically for Shopify & WooCommerce
  const requestHeaders = {
    ...headers,
    ...(platform === "shopify" && {
      "X-Shopify-Access-Token": settings?.accessToken, // Shopify API Token (from cURL)
    }),
    ...(platform === "woo" && {
      Authorization: headers.Authorization || "", // WooCommerce Basic Auth
    }),
  };

  // 🔥 Debugging log (optional)
  console.log("[DEBUG] API Request:", {
    url,
    method,
    headers: requestHeaders,
    body: body || "No body",
    platform,
  });

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      ...(body ? { body: JSON.stringify(body) } : {}),
      mode: "cors",
      cache: "no-cache",
      referrerPolicy: "no-referrer",
    });

    const responseText = await response.text();

    // 🔥 Log raw response (optional)
    // console.log("[DEBUG] Raw API Response:", {
    //   status: response.status,
    //   statusText: response.statusText,
    //   responseText,
    // });

    let parsedData;
    try {
      parsedData = responseText ? JSON.parse(responseText) : null;
    } catch {
      console.warn("[WARNING] Failed to parse API response:", responseText);
      parsedData = responseText;
    }

    if (!response.ok) {
      console.error("[ERROR] API Request Failed:", {
        url,
        method,
        status: response.status,
        responseBody: parsedData,
      });

      throw new ApiError({
        requestUrl: url,
        requestMethod: method,
        requestHeaders: requestHeaders,
        requestBody: body,
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseBody: parsedData,
      });
    }

    console.log("[SUCCESS] API Request Completed:", {
      url,
      method,
      status: response.status,
      responseBody: parsedData,
    });

    return parsedData;
  } catch (error) {
    console.error("[ERROR] Network/API Failure:", error);

    throw new ApiError({
      requestUrl: url,
      requestMethod: method,
      requestHeaders: requestHeaders,
      requestBody: body,
      responseStatus: 0,
      responseStatusText: "Network Error",
      responseBody: error instanceof Error ? error.message : "Failed to fetch",
    });
  }
};
