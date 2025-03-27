import { apiClient } from "../api/client";
import type { OrderNote, CreateNoteRequest } from "../../types/order";

const getShopId = (storeUrl: string): string => {
  try {
    return storeUrl.split(".")[0];
  } catch {
    console.error("Invalid Shopify store URL format", storeUrl);
    throw new Error("Invalid Shopify store configuration");
  }
};

interface ShopifyNoteEvent {
  id: number;
  created_at: string;
  verb: string;
  body: string | null;
  description: string;
  author: string;
}

export const getOrderNotes = async (orderId: string): Promise<OrderNote[]> => {
  const settingsRaw = localStorage.getItem("wc_settings");
  if (!settingsRaw) throw new Error("Missing store configuration");

  const settings = JSON.parse(settingsRaw);
  const { authType, storeUrl } = settings;

  const path =
    authType === "shopify"
      ? `/shopify_order_notes?shopId=${getShopId(storeUrl)}&orderId=${orderId}`
      : `/orders/${orderId}/notes`;

  const response = await apiClient<
    { events?: ShopifyNoteEvent[] } | OrderNote[]
  >({ method: "GET", path });

  if (authType === "shopify") {
    if ("events" in response) {
      return (response.events || [])
        .filter((event: ShopifyNoteEvent) => event.description)
        .map((event: ShopifyNoteEvent) => ({
          id: event.id,
          date_created: event.created_at,
          note: event.description,
          customer_note: event.verb === "note_created",
          author: event.author,
        }));
    }
  }

  return response as OrderNote[];
};

export const createOrderNote = async (
  orderId: string,
  { note, customer_note }: CreateNoteRequest
): Promise<OrderNote> => {
  const settingsRaw = localStorage.getItem("wc_settings");
  if (!settingsRaw) throw new Error("Missing store configuration");

  const settings = JSON.parse(settingsRaw);

  if (settings.authType === "shopify") {
    return apiClient<OrderNote>({
      method: "POST",
      path: `/shopify_order_notes/${orderId}`,
      body: { note, customer_note },
    });
  }

  return apiClient<OrderNote>({
    method: "POST",
    path: `/orders/${orderId}/notes`,
    body: { note, customer_note },
  });
};
