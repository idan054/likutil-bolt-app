import React from "react";
import { Truck, Zap, MapPin, AlertCircle } from "lucide-react";
import type { DeliveryCheck, DeliveryDecisionState, DeliveryType } from "../../types/fastDelivery";

interface DeliveryTypeBadgeProps {
  // fallback (when no decision exists yet)
  shippingMethodTitle?: string | null;
  shippingMethodId?: string | null;
  shippingInstanceId?: string | number | null; // WooCommerce instance_id - most reliable
  shippingCost?: string | number | null; // For fallback detection by price

  // preferred (when decision exists)
  deliveryType?: DeliveryType;
  decisionState?: DeliveryDecisionState;
  checks?: DeliveryCheck[];
  className?: string;
}

// Configure your fast delivery instance IDs here
const FAST_DELIVERY_INSTANCE_IDS = [27]; // spider3d.co.il מהיר לי

const normalize = (v: string) => v.trim().toLowerCase();

const isFastMethodTitle = (title: string) => {
  const t = normalize(title);
  return (
    t.includes("מהיר") ||
    t.includes("מהיום להיום") ||
    t.includes("היום להיום") ||
    t.includes("fast") ||
    t.includes("same day") ||
    t.includes("same-day")
  );
};

const isPickupMethodTitle = (title: string) => {
  const t = normalize(title);
  return t.includes("איסוף") || t.includes("pickup") || t.includes("local_pickup");
};

type BadgeType = "fast" | "regular" | "needs_review" | "pickup";

const badge = (type: BadgeType) => {
  switch (type) {
    case "fast":
      return "bg-emerald-100 text-emerald-800";
    case "pickup":
      return "bg-orange-100 text-orange-800";
    case "needs_review":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

const getIcon = (type: BadgeType) => {
  switch (type) {
    case "fast":
      return <Zap size={12} className="inline-block mr-1" />;
    case "pickup":
      return <MapPin size={12} className="inline-block mr-1" />;
    case "needs_review":
      return <AlertCircle size={12} className="inline-block mr-1" />;
    default:
      return <Truck size={12} className="inline-block mr-1" />;
  }
};

export const DeliveryTypeBadge: React.FC<DeliveryTypeBadgeProps> = ({
  shippingMethodTitle,
  shippingMethodId,
  shippingInstanceId,
  shippingCost,
  deliveryType,
  decisionState,
  checks,
  className = "",
}) => {
  // Check if instance_id matches fast delivery (most reliable)
  const isFastByInstanceId = shippingInstanceId != null && 
    FAST_DELIVERY_INSTANCE_IDS.includes(Number(shippingInstanceId));

  // Check if shipping cost indicates fast delivery (e.g., ₪45) - less reliable fallback
  const isFastByPrice = (() => {
    if (!shippingCost) return false;
    const cost = typeof shippingCost === 'string' ? parseFloat(shippingCost) : shippingCost;
    return cost >= 40 && cost <= 50;
  })();

  const derivedType: BadgeType = (() => {
    // Check for pickup first (from method_id or title)
    if (shippingMethodId === "local_pickup") return "pickup";
    if (shippingMethodTitle && isPickupMethodTitle(shippingMethodTitle)) return "pickup";
    
    // Then check decision state
    if (decisionState === "needs_review") return "needs_review";
    if (deliveryType) return deliveryType === "fast" ? "fast" : "regular";
    
    // Fallbacks: instance_id (best), title, price (worst)
    if (isFastByInstanceId) return "fast";
    if (shippingMethodTitle && isFastMethodTitle(shippingMethodTitle)) return "fast";
    if (isFastByPrice) return "fast";
    
    return "regular";
  })();

  const label = (() => {
    switch (derivedType) {
      case "pickup": return "איסוף עצמי";
      case "fast": return "מהיר לי";
      case "needs_review": return "דורש בדיקה";
      default: return "רגיל";
    }
  })();

  const title =
    checks && checks.length
      ? checks.map((c) => `${c.ok ? "✔" : "✖"} ${c.label}`).join("\n")
      : undefined;

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge(derivedType)} ${className}`}
      title={title}
    >
      {getIcon(derivedType)}
      {label}
    </span>
  );
};

