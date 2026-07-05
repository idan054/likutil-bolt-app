// customers.service.ts
import { apiClient } from "../api/client";
import type { CustomerDetails } from "../../types/customer";
import { getApiConfig } from "../api/config";

// Shopify customer cache
const shopifyCustomerCache = new Map<number, CustomerDetails>();

export const getCustomerById = async (
  customerId: number
): Promise<CustomerDetails> => {
  const config = getApiConfig();

  // Shopify implementation
  if (config.platform === "shopify") {
    // Return cached customer if available
    const cachedCustomer = shopifyCustomerCache.get(customerId);
    if (cachedCustomer) {
      return cachedCustomer;
    }

    // Fallback for missing customers
    return createEmptyShopifyCustomer(customerId);
  }

  // Original WooCommerce implementation
  return apiClient<CustomerDetails>({
    method: "GET",
    path: `/customers/${customerId}`,
  });
};

export const getCustomersByIds = async (
  customerIds: number[]
): Promise<CustomerDetails[]> => {
  const config = getApiConfig();

  // Shopify implementation
  if (config.platform === "shopify") {
    return customerIds.map((id) => {
      const cached = shopifyCustomerCache.get(id);
      return cached || createEmptyShopifyCustomer(id);
    });
  }

  // Original WooCommerce implementation
  return apiClient<CustomerDetails[]>({
    method: "GET",
    path: `/customers?include=${customerIds.join(",")}`,
  });
};

// Shopify-specific helper functions
const createEmptyShopifyCustomer = (id: number): CustomerDetails => ({
  id,
  email: "",
  first_name: "",
  last_name: "",
  username: "",
  role: "customer",
  is_vip_member: false,
  billing: {
    first_name: "",
    last_name: "",
    company: "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
    email: "",
    phone: "",
  },
  shipping: {
    first_name: "",
    last_name: "",
    company: "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
  },
  is_paying_customer: false,
  orders_count: 0,
  total_spent: "0",
  avatar_url: "",
  meta_data: [],
});

export const cacheShopifyCustomerFromOrder = (order: any): void => {
  const config = getApiConfig();
  if (config.platform === "shopify" && order.customer) {
    const customer: CustomerDetails = {
      id: order.customer.id,
      email: order.email || order.customer.email || "",
      first_name:
        order.customer.first_name || order.billing_address?.first_name || "",
      last_name:
        order.customer.last_name || order.billing_address?.last_name || "",
      username: "",
      role: "customer",
      is_vip_member: false,
      billing: {
        first_name: order.billing_address?.first_name || "",
        last_name: order.billing_address?.last_name || "",
        company: order.billing_address?.company || "",
        address_1: order.billing_address?.address1 || "",
        address_2: order.billing_address?.address2 || "",
        city: order.billing_address?.city || "",
        state: order.billing_address?.province || "",
        postcode: order.billing_address?.zip || "",
        country:
          order.billing_address?.country ||
          order.billing_address?.country_code ||
          "",
        email: order.email || "",
        phone: order.phone || order.billing_address?.phone || "",
      },
      shipping: {
        first_name:
          order.shipping_address?.first_name ||
          order.billing_address?.first_name ||
          "",
        last_name:
          order.shipping_address?.last_name ||
          order.billing_address?.last_name ||
          "",
        company: order.shipping_address?.company || "",
        address_1:
          order.shipping_address?.address1 ||
          order.billing_address?.address1 ||
          "",
        address_2:
          order.shipping_address?.address2 ||
          order.billing_address?.address2 ||
          "",
        city: order.shipping_address?.city || order.billing_address?.city || "",
        state:
          order.shipping_address?.province ||
          order.billing_address?.province ||
          "",
        postcode:
          order.shipping_address?.zip || order.billing_address?.zip || "",
        country:
          order.shipping_address?.country ||
          order.billing_address?.country ||
          "",
      },
      is_paying_customer: order.financial_status === "paid",
      orders_count: 0, // Not available in Shopify order data
      total_spent: order.total_price || "0",
      avatar_url: "",
      meta_data:
        order.note_attributes?.map((attr: { name: string; value: string }) => ({
          id: Math.random(),
          key: attr.name,
          value: attr.value,
        })) || [],
    };

    shopifyCustomerCache.set(order.customer.id, customer);
  }
};
