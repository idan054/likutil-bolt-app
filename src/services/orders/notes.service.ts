import { apiClient } from "../api/client";
import type { OrderNote, CreateNoteRequest, OrderDetails } from "../../types/order";
import { useSettings } from "../../hooks/useSettings";
import { UserSettings } from "../../types/settings";

// const getShopId = (storeUrl: string): string => {
//   try {
//     return storeUrl.split(".")[0];
//   } catch {
//     console.error("Invalid Shopify store URL format", storeUrl);
//     throw new Error("Invalid Shopify store configuration");
//   }
// };

interface ShopifyNoteEvent {
  id: number;
  created_at: string;
  verb: string;
  body: string | null;
  description: string;
  author: string;
}

export const getOrderNotes = async (settings: UserSettings | null, orderId: string): Promise<OrderNote[]> => {
  // const settingsRaw = localStorage.getItem("wc_settings");
  


  const path =
  settings?.authType === "shopify"
      ? `/shopify_order_notes?shopId=${settings.myShopifyUrl}&orderId=${orderId}`
      : `/orders/${orderId}/notes`;

  const response = await apiClient<
    { events?: ShopifyNoteEvent[] } | OrderNote[]
  >({ method: "GET", path });

  if (settings?.authType === "shopify") {
    if ("events" in response) {
      return (response.events || [])
        .filter((event: ShopifyNoteEvent) => event.body)
        .map((event: ShopifyNoteEvent) => ({
          id: event.id,
          date_created: event.created_at,
          // note: event.description,
          note: event.body,
          customer_note: event.verb === "follow_up",
          author: event.author,
        }));
    }
  }

  return response as OrderNote[];
};

export const createOrderNote = async (
  orderId: string,
  { note, customer_note }: CreateNoteRequest,
  order: OrderDetails,
): Promise<OrderNote> => {
  const settingsRaw = localStorage.getItem("wc_settings");
  if (!settingsRaw) throw new Error("Missing store configuration");

  const settings = JSON.parse(settingsRaw);


  if (settings.authType === "shopify") {
    return apiClient<OrderNote>({
      method: "PUT",
      path: `/add_shopify_order_note`,
       body: {
         'order_number': order.order_number,
         "shopId": settings.myShopifyUrl,
         'store_url': settings?.store_url ?? settings?.storeUrl,
         "orderId": orderId,
         "note": note,

         "customer_note": customer_note,
         'to_email': order.billing?.email,
      },
    });
  }



  return apiClient<OrderNote>({
    method: "POST",
    path: `/orders/${orderId}/notes`,
    body: { note, customer_note },
  });
};
