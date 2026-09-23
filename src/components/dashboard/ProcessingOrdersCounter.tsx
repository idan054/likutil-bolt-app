import React, { useState, useCallback } from "react";
import { Package, Rows3 } from "lucide-react";
import { motion } from "framer-motion";
import { OrdersHeader } from "./orders/OrdersHeader";
import { SuperOrderButton } from "./orders/SuperOrderButton";
import type { OrderSummary } from "../../types/order";

interface ProcessingOrdersCounterProps {
  orders: OrderSummary[];
  onGenerateSuperOrder: (orders: OrderSummary[]) => void;
  isGenerating?: boolean;
  completedOrdersCount: number;
  selectedStatus: string | null;
  loadedCount: number;
  totalOrders: number | null;
  isLoading?: boolean;
}

export const ProcessingOrdersCounter: React.FC<
  ProcessingOrdersCounterProps
> = ({
  orders,
  onGenerateSuperOrder,
  isGenerating = false,
  completedOrdersCount,
  selectedStatus,
  loadedCount,
  totalOrders,
  isLoading = false,
}) => {
  const [isSuperOrderEnabled, setIsSuperOrderEnabled] = useState(false);
  const pendingOrdersCount = orders.length - completedOrdersCount;
  const countLabel = isLoading
    ? "…"
    : totalOrders !== null && totalOrders > loadedCount
      ? `${loadedCount} מתוך ${totalOrders}`
      : totalOrders === null && loadedCount >= 15
        ? `${loadedCount}+`
        : String(loadedCount);

  const handleSuperOrderClick = useCallback(async () => {
    if (!isSuperOrderEnabled) {
      await import("../../utils/superOrder/processor");
      setIsSuperOrderEnabled(true);
    }
    onGenerateSuperOrder(orders);
  }, [orders, onGenerateSuperOrder, isSuperOrderEnabled]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-blue-50 rounded-lg p-6 mb-6"
    >
      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between">
        <OrdersHeader count={loadedCount} total={totalOrders} isLoading={isLoading} icon={Package} selectedStatus={selectedStatus}
 />
        <div className="flex items-center gap-4">
          <SuperOrderButton
            count={pendingOrdersCount}
            onClick={handleSuperOrderClick}
            isDisabled={isGenerating || pendingOrdersCount === 0}
            icon={Rows3}
          />
          <motion.span
            className="text-4xl font-bold text-blue-600"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {countLabel}
          </motion.span>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden space-y-4">
        <OrdersHeader count={loadedCount} total={totalOrders} isLoading={isLoading} icon={Package} selectedStatus={selectedStatus} />
        <div className="flex flex-col gap-3">
          <motion.span
            className="text-4xl font-bold text-blue-600 text-center"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {countLabel}
          </motion.span>
          <SuperOrderButton
            count={pendingOrdersCount}
            onClick={handleSuperOrderClick}
            isDisabled={isGenerating || pendingOrdersCount === 0}
            icon={Rows3}
            isMobile
          />
        </div>
      </div>
    </motion.div>
  );
};
