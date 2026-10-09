import { getLabelCarrier } from "./shippingLabel";

/**
 * ZipGo carries up to two cartons (10 kg each) in one shipment, for the price of one shipment.
 * More cartons go out as another shipment ("משלוח נוסף").
 */
export const ZIPGO_MAX_PACKAGES = 2;

/** The highest package count the counter allows for one shipment at this courier. */
export const maxPackagesPerShipment = (provider: string): number => {
  if (provider === "zipGo") return ZIPGO_MAX_PACKAGES;
  return getLabelCarrier(provider) === "negev" ? 20 : 99;
};

/** What the picker does above the courier's limit, shown under the counter; null when there is nothing to say. */
export const packageLimitHint = (provider: string): string | null =>
  provider === "zipGo" ? "עד שני קרטונים במשלוח אחד. יותר משני קרטונים: משלוח נוסף." : null;
