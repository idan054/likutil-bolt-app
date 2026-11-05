/**
 * An exchange order's shipping line on the shop site reads "משלוח הלוך-חזור בשליח, כולל איסוף …":
 * a courier delivers and takes the old item back in the same visit. It is a courier delivery,
 * not a self-pickup, even though the title contains "איסוף".
 */
export const isRoundtripShippingTitle = (title?: string | null): boolean =>
  /הלוך[\s_-]*חזור/.test(title || '');

export const hasRoundtripShipping = (
  shippingLines?: Array<{ method_title?: string }> | null
): boolean => Boolean(shippingLines?.some((line) => isRoundtripShippingTitle(line?.method_title)));

/**
 * Exchange orders made on the site (Roni's tool, or by hand like 86714 / 86385) carry the round trip as a
 * product line named "משלוח הלוך-חזור בשליח, …" and have no shipping line at all, so both are checked.
 */
export const isRoundtripOrder = (order?: {
  shipping_lines?: Array<{ method_title?: string }> | null;
  line_items?: Array<{ name?: string }> | null;
} | null): boolean =>
  hasRoundtripShipping(order?.shipping_lines) ||
  Boolean(order?.line_items?.some((item) => isRoundtripShippingTitle(item?.name)));
