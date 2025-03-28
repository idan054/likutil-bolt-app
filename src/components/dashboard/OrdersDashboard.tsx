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

  const [isMobileDetailsVisible, setIsMobileDetailsVisible] = useState(false);

  // Update browser history when selecting an order
  useEffect(() => {
    if (selectedOrderId) {
      window.history.pushState(
        { view: "order-details" },
        "",
        `?order=${selectedOrderId}`
      );
      setIsMobileDetailsVisible(true);
    }
  }, [selectedOrderId]);

  const handleBackToList = () => {
    window.history.pushState({ view: "orders-list" }, "", "/");
    handleReset();
    setIsMobileDetailsVisible(false);
  };

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
        <div className="flex flex-col md:flex-row gap-1 mt-6">
          <div id="orders-sidebar" className={`w-full md:w-1/4 mb-4 md:mb-0 ${isMobileDetailsVisible ? 'hidden md:block' : 'block'}`}>
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
          <div id="orders-details" className={`w-full md:w-3/4 ${isMobileDetailsVisible ? 'block' : 'hidden md:block'}`}>
            {selectedOrder ? (
              <OrderDetails
                order={selectedOrder}
                onReset={handleBackToList}
                onComplete={() => handleOrderComplete(selectedOrderId)}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mr-5">
                <div className="text-center p-8">
                <svg className="mx-auto h-16 w-16 text-gray-400 bg-gray-200 bg-opacity-75 rounded-full p-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                  <h3 className="mt-2 text-xl font-semibold text-gray-900">כאן יופיע פרטי ההזמנה</h3>
                  <p className="mt-1 text-sm text-gray-500">בחר הזמנה מהרשימה כדי לצפות בפרטים</p>
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
