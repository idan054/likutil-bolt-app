import React from "react";
import { Truck, Zap, MapPin, AlertCircle } from "lucide-react";
import type { DeliveryCheck, DeliveryDecisionState, DeliveryType } from "../../types/fastDelivery";
import type { OrderSummary } from "../../types/order";
import { getOrderDeliveryBadgeType, hasSelectedFastShipping } from "../../utils/shippingMethod";

interface DeliveryTypeBadgeProps {
  shippingLines?: OrderSummary["shipping_lines"];
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

type BadgeType = ReturnType<typeof getOrderDeliveryBadgeType>;

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
  shippingLines,
  shippingMethodTitle,
  shippingMethodId,
  shippingInstanceId,
  shippingCost,
  deliveryType,
  decisionState,
  checks,
  className = "",
}) => {
  const fallbackShippingLine = {
    method_title: shippingMethodTitle || "",
    method_id: shippingMethodId || undefined,
    instance_id: shippingInstanceId ?? undefined,
    total: shippingCost == null ? undefined : String(shippingCost),
  };
  const effectiveShippingLines = shippingLines ?? [fallbackShippingLine];
  const isSelectedFastMethod = hasSelectedFastShipping(effectiveShippingLines);
  const derivedType = getOrderDeliveryBadgeType(effectiveShippingLines, {
    deliveryType,
    decisionState,
  });

  const label = (() => {
    switch (derivedType) {
      case "pickup": return "איסוף עצמי";
      case "fast": return "מהיר לי";
      case "needs_review": return "דורש בדיקה";
      default: return "רגיל";
    }
  })();

  const effectiveChecks =
    isSelectedFastMethod && derivedType === "fast" && decisionState !== "manual"
      ? [{ label: "שיטת משלוח מהיר נקבעה בחנות", ok: true }]
      : checks;

  const title =
    effectiveChecks && effectiveChecks.length
      ? effectiveChecks.map((c) => `${c.ok ? "✔" : "✖"} ${c.label}`).join("\n")
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

