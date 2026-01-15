import React from "react";
import type { DeliveryCheck, DeliveryDecisionState, DeliveryType } from "../../types/fastDelivery";

interface DeliveryTypeBadgeProps {
  // fallback (when no decision exists yet)
  shippingMethodTitle?: string | null;

  // preferred (when decision exists)
  deliveryType?: DeliveryType;
  decisionState?: DeliveryDecisionState;
  checks?: DeliveryCheck[];
  className?: string;
}

const normalize = (v: string) => v.trim().toLowerCase();

const isFastMethodTitle = (title: string) => {
  const t = normalize(title);
  return t.includes("מהיר") || t.includes("מהיר לי") || t.includes("fast") || t.includes("same day");
};

const badge = (type: "fast" | "regular" | "needs_review") => {
  switch (type) {
    case "fast":
      return "bg-emerald-100 text-emerald-800";
    case "needs_review":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

export const DeliveryTypeBadge: React.FC<DeliveryTypeBadgeProps> = ({
  shippingMethodTitle,
  deliveryType,
  decisionState,
  checks,
  className = "",
}) => {
  const derivedType: "fast" | "regular" | "needs_review" = (() => {
    if (decisionState === "needs_review") return "needs_review";
    if (deliveryType) return deliveryType === "fast" ? "fast" : "regular";
    if (!shippingMethodTitle) return "regular";
    return isFastMethodTitle(shippingMethodTitle) ? "fast" : "regular";
  })();

  const label =
    derivedType === "needs_review" ? "דורש בדיקה" : derivedType === "fast" ? "מהיר לי" : "רגיל";

  const title =
    checks && checks.length
      ? checks.map((c) => `${c.ok ? "✔" : "✖"} ${c.label}`).join("\n")
      : undefined;

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${badge(derivedType)} ${className}`}
      title={title}
    >
      {label}
    </span>
  );
};
