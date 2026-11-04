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
