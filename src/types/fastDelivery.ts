export type DeliveryType = "fast" | "regular";
export type DeliveryDecisionState = "auto" | "manual" | "needs_review";

export interface FastDeliveryRules {
  storeKey: string;
  cities: string[];
  blockedKeywords: string[];
  vipRoles: string[];
  updatedAt: string; // ISO
  updatedBy?: string;
}

export interface DeliveryCheck {
  label: string;
  ok: boolean;
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
  updatedAt: string; // ISO
}
