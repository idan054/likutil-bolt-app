export interface DisplayMetadata {
  label: string;
  value: string;
}

const formatDealExpiry = (value: string) => {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/
  );
  return match
    ? `${match[3]}.${match[2]}.${match[1]} בשעה ${match[4]}:${match[5]}`
    : value;
};

export const getOrderItemMetadataDisplay = (
  key: string,
  rawValue: unknown
): DisplayMetadata | null => {
  const trimmedKey = key.trim();
  const machineKey = trimmedKey.replace(/^_+|_+$/g, "");
  const value = String(rawValue ?? "");

  switch (machineKey) {
    case "s3d_daily_deal_purchase":
      return {
        label: "רכישה במבצע יומי",
        value: ["1", "true", "yes"].includes(value.toLowerCase())
          ? "כן"
          : ["0", "false", "no"].includes(value.toLowerCase())
            ? "לא"
            : value,
      };
    case "s3d_daily_deal_price": {
      const amount = Number(value);
      return {
        label: "מחיר המבצע",
        value:
          value.trim() !== "" && Number.isFinite(amount)
            ? new Intl.NumberFormat("he-IL", {
                style: "currency",
                currency: "ILS",
                maximumFractionDigits: 2,
              }).format(amount)
            : value,
      };
    }
    case "s3d_daily_deal_expires_at":
      return { label: "תוקף המבצע עד", value: formatDealExpiry(value) };
    case "s3d_daily_deal_product_id":
      // The item itself is already named in the card.
      return null;
    default:
      // WooCommerce and Shopify use a leading underscore for internal metadata.
      return trimmedKey.startsWith("_")
        ? null
        : { label: trimmedKey, value };
  }
};
