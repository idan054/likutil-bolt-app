export type DeliveryType = "fast" | "regular";
export type DeliveryDecisionState = "auto" | "manual" | "needs_review";

export interface FastDeliveryRules {
  storeKey: string;
  cities: string[];
  blockedKeywords: string[];
  blockedProductIds: number[];
  blockedCategoryIds: number[];
  blockedPriceThreshold: number;
  vipRoles: string[];
  updatedAt: string; // ISO
  updatedBy?: string;
}

export interface DeliveryCheck {
  label: string;
  ok: boolean;
  detail?: string;
}

export interface FastDeliveryProductCategory {
  id?: number;
  name: string;
  slug?: string;
}

export interface FastDeliveryLineItem {
  productId?: number;
  variationId?: number;
  sku?: string;
  name: string;
  unitPrice?: number;
  categories: FastDeliveryProductCategory[];
  categoryDataComplete: boolean;
}

export interface OrderDeliveryDecision {
  storeKey: string;
  orderId: number;
  deliveryType: DeliveryType;
  decisionState: DeliveryDecisionState;
  override: boolean;
  checks: DeliveryCheck[];
  wooSyncError?: boolean;
  wooLastSyncAt?: string; // ISO
  rulesUpdatedAt?: string; // ISO snapshot used for the automatic decision
  inputFingerprint?: string;
  updatedAt: string; // ISO
}
