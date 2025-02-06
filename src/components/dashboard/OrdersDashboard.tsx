import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-hot-toast";
import { OrderSearch } from "../OrderSearch";
import { OrderDetails } from "../OrderDetails";
import { ProcessingOrdersCounter } from "./ProcessingOrdersCounter";
import { OrdersList } from "./OrdersList";
import { SuperOrderModal } from "../superOrder/SuperOrderModal";
import { LoadingState } from "./states/LoadingState";
import { EmptyState } from "./states/EmptyState";
import { useAppState } from "../../hooks/useAppState";
import { useSuperOrder } from "../../hooks/useSuperOrder";
import { useOrderSelection } from "./hooks/useOrderSelection";
import { useVisitedOrders } from "../../hooks/useVisitedOrders";

export const OrdersDashboard: React.FC = () => {
  const { orders, isLoading, isRefetching } = useAppState();
  const { selectedOrderId, handleOrderSelect, handleReset } =
    useOrderSelection(orders);
  const { markAsCompleted, isCompleted } = useVisitedOrders();
  const {
    generateSuperOrder,
    items: superOrderItems,
    clearSuperOrder,
    isLoading: isGeneratingSuperOrder,
  } = useSuperOrder();

  // Handle browser history
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view === "orders-list") {
        handleReset();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [handleReset]);

  // Update browser history when selecting an order
  useEffect(() => {
    if (selectedOrderId) {
      window.history.pushState(
        { view: "order-details" },
        "",
        `?order=${selectedOrderId}`
      );
    }
  }, [selectedOrderId]);

  // Calculate completed orders count
  const completedOrdersCount = useMemo(() => {
    return orders.filter((order) => isCompleted(order.id.toString())).length;
  }, [orders, isCompleted]);

  const handleOrderComplete = (orderId: string) => {
    markAsCompleted(orderId);
  };

  const handleOrderSelection = (orderId: string) => {
    handleOrderSelect(orderId);
  };

  const handleBackToList = () => {
    window.history.pushState({ view: "orders-list" }, "", "/");
    handleReset();
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }

    if (orders.length === 0) {
      return <EmptyState />;
    }

    if (selectedOrderId) {
      const selectedOrder = orders.find(
        (o) => o.id.toString() === selectedOrderId
      );
      if (selectedOrder) {
        return (
          <div className="flex justify-center">
            <OrderDetails
              order={selectedOrder}
              onReset={handleBackToList}
              onComplete={() => handleOrderComplete(selectedOrderId)}
            />
          </div>
        );
      }
      handleReset();
      return null;
    }

    return (
      <div className="max-w-4xl mx-auto">
        <ProcessingOrdersCounter
          orders={orders}
          onGenerateSuperOrder={generateSuperOrder}
          isGenerating={isGeneratingSuperOrder}
          completedOrdersCount={completedOrdersCount}
          isRefetching={isRefetching}
        />
        {orders.length > 0 ? (
          <OrdersList
            orders={orders}
            onSelectOrder={handleOrderSelection}
            isCompleted={isCompleted}
            isRefetching={isRefetching}
          />
        ) : (
          !isLoading && <EmptyState />
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-center mb-8">
        <OrderSearch onSearch={handleOrderSelect} isLoading={false} />
      </div>

      {renderContent()}

      {superOrderItems && (
        <SuperOrderModal items={superOrderItems} onClose={clearSuperOrder} />
      )}
    </>
  );
};
