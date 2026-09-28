type StoreOrder = {
  id?: number | string;
  status?: string;
  meta_data?: Array<{ key: string; value: unknown }>;
  financial_status?: string;
  fulfillment_status?: string | null;
  confirmed?: boolean;
  cancelled_at?: string | null;
  payment_terms?: unknown;
};

const normalizeStatus = (status?: string) => (status ?? "").trim().toLowerCase().replace(/^wc-/, "");
const inactiveStatuses = new Set(["draft", "auto-draft", "checkout-draft", "failed", "cancelled", "refunded", "trash", "unknown"]);

// Shopify's UI uses "pending" for unfulfilled orders; it is not Woo's pending payment.
export const isPickingStatus = (status: string, platform = "woo"): boolean => {
  const value = normalizeStatus(status);
  return Boolean(value) && !inactiveStatuses.has(value) && !value.startsWith("rfq-") &&
    (platform !== "woo" || (value !== "pending" && value !== "on-hold"));
};

export const getOrderBlockReason = (order: StoreOrder, platform: string): string | null => {
  if (platform === "woo") {
    const meta = (key: string) => order.meta_data?.find((entry) => entry.key === key)?.value;
    const flag = (key: string) => [true, 1, "1", "yes"].includes(meta(key) as string | number | boolean);
    // RFQ parents are documents, including approved/paid proposals. Only their
    // separate picking children belong in fulfillment, even on deferred terms.
    if (normalizeStatus(order.status).startsWith("rfq-") ||
        (flag("_s3rfq") && !flag("_s3rfq_child"))) {
      return "זו הצעת מחיר ולא הזמנת ליקוט. אין להכין או לשלוח אותה; יש לפנות למשרד.";
    }
    if (flag("_s3rfq_frozen") || !isPickingStatus(order.status ?? "", platform)) {
      return "ההזמנה אינה מאושרת לליקוט ולמשלוח במצבה הנוכחי. יש לפנות למשרד.";
    }
    // Processing also covers approved COD and B2B orders; date_paid is not a gate.
    return null;
  }
  if (platform === "shopify") {
    if (order.cancelled_at || order.confirmed === false ||
        (order.status && !isPickingStatus(order.status, platform))) {
      return "ההזמנה אינה מאושרת לליקוט ולמשלוח במצבה הנוכחי. יש לפנות למשרד.";
    }
    const financial = order.financial_status;
    if (["paid", "authorized"].includes(financial ?? "") ||
        (["pending", "partially_paid"].includes(financial ?? "") && order.confirmed === true && order.payment_terms)) {
      return null;
    }
    return "לא התקבל אישור תשלום או תנאי תשלום מאושרים להזמנה. אין להכין או לשלוח אותה.";
  }
  return "לא ניתן לאמת שההזמנה מאושרת לליקוט.";
};

export class OrderNotReadyError extends Error {
  constructor(orderId: string | number, reason: string) {
    super(`הזמנה #${orderId}: ${reason}`);
    this.name = "OrderNotReadyError";
  }
}

export const assertOrderReady = (order: StoreOrder, platform: string): void => {
  const reason = getOrderBlockReason(order, platform);
  if (reason) throw new OrderNotReadyError(order.id ?? "", reason);
};
