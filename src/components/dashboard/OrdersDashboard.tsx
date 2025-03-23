import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-hot-toast";
import { OrderSearch } from "../OrderSearch";
// import { OrderDetails } from "../OrderDetails";
import { ProcessingOrdersCounter } from "./ProcessingOrdersCounter";
import { OrdersList } from "./OrdersList";
import { SuperOrderModal } from "../superOrder/SuperOrderModal";
import { LoadingState } from "./states/LoadingState";
import { EmptyState } from "./states/EmptyState";
import { useAppState } from "../../hooks/useAppState";
import { useSuperOrder } from "../../hooks/useSuperOrder";
import { useOrderSelection } from "./hooks/useOrderSelection";
import { useVisitedOrders } from "../../hooks/useVisitedOrders";
import { AppInfoStatus } from "../ui/AppInfoStatus";
import { OrderDetails } from "../OrderDetails";
// import { OrderDetails } from '../../types/order';


interface OrdersDashboardProps {
  
}

export const OrdersDashboard: React.FC<OrdersDashboardProps> = () => {
  const { orders, isLoading, isRefetching, setOrders } = useAppState();
  const { selectedOrderId, handleOrderSelect, handleReset, handleSearchOrder } = useOrderSelection(orders, setOrders);
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

  const handleSearchOrdered = (order: any) => {
    handleSearchOrder(order);
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

    const selectedOrder = selectedOrderId
      ? orders.find((o) => o.id.toString() === selectedOrderId)
      : null;

    return (
      <div className="max-w-7xl mx-auto">
        <ProcessingOrdersCounter
          orders={orders}
          onGenerateSuperOrder={generateSuperOrder}
          isGenerating={isGeneratingSuperOrder}
          completedOrdersCount={completedOrdersCount}
          isRefetching={isRefetching}
        />
        <div className="flex gap-1 mt-6">
          <div className="w-1/4">
            <div className="mb-2">
              <OrderSearch onSearch={handleSearchOrdered}/>
            </div>
            <OrdersList
              orders={orders}
              onSelectOrder={handleOrderSelection}
              isCompleted={isCompleted}
              selectedOrderId={selectedOrderId}
            />
            <AppInfoStatus />
          </div>
          <div className="w-3/4">
            {selectedOrder ? (
              <OrderDetails
                order={selectedOrder}
                onReset={handleBackToList}
                onComplete={() => handleOrderComplete(selectedOrderId)}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900">No order selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Select an order from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
   

      {renderContent()}

      {superOrderItems && (
        <SuperOrderModal items={superOrderItems} onClose={clearSuperOrder} />
      )}
    </>
  );
};
