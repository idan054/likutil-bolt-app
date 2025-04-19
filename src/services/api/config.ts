import { settingsStorage } from "../settings";
import { ApiConfig } from "./types";
import { UserSettings } from "../../types/settings";
import { BASE_URL } from "../auth/woo-auth";

// WooCommerce - Uses dynamic credentials
const getWooApiConfig = (settings: UserSettings): ApiConfig => {
  if (!settings.storeUrl || !settings.consumerKey || !settings.consumerSecret) {
    throw new Error("Incomplete WooCommerce settings.");
  }

  const baseUrl = `https://${settings.storeUrl}/wp-json/wc/v3`;
  const auth = btoa(`${settings.consumerKey}:${settings.consumerSecret}`);

  return {
    baseUrl,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    platform: "woo",
  };
};

// Shopify - Uses either stored token or fallback hardcoded token
const getShopifyApiConfig = (settings: UserSettings): ApiConfig => {
  const accessToken = settings.accessToken; // Ensure token is set

  return {
    baseUrl: BASE_URL,
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    platform: "shopify",
  };
};

// Fetch authType dynamically & return appropriate API config
export const getApiConfig = (): ApiConfig => {
  const settings = settingsStorage.get();

  if (!settings) {
    throw new Error("No API configuration found");
  }

  const authType = settings.authType?.toLowerCase(); // Normalize case

  // console.log("[DEBUG] Fetched settings:", settings);
  // console.log("[DEBUG] authType:", authType);

  if (authType === "woo") {
    // console.log("[DEBUG] Using WooCommerce API config.");
    return getWooApiConfig(settings);
  } else if (authType === "shopify") {
    // console.log("[DEBUG] Using Shopify API config.");
    return getShopifyApiConfig(settings);
  }

  throw new Error(
    `Unknown authType: ${authType}. Unable to determine API configuration.`
  );
};

// Shopify param builder - Hardcoded shopId
export const buildShopifyParams = (params: Record<string, string>): string => {
  let shopId: string | undefined;

  try {
    const wcSettings = JSON.parse(localStorage.getItem("wc_settings") || "{}");

    if (wcSettings?.storeUrl) {
      shopId = new URL(`https://${wcSettings.storeUrl}`).hostname.split(".")[0];
    }
  } catch (error) {
    console.error("Error parsing wc_settings from localStorage:", error);
  }

  return new URLSearchParams({
    ...(shopId ? { shopId } : {}), // Only include shopId if it's defined
    ...params,
  }).toString();
};
