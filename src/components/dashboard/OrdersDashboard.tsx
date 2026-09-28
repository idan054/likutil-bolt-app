import React, { useState, useMemo, useEffect, useCallback } from "react";
import { OrderSearch } from "../OrderSearch";
import { ProcessingOrdersCounter } from "./ProcessingOrdersCounter";
import { StatusFilter } from "./StatusFilter";
import { useSettings } from "../../hooks/useSettings";
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
import type { OrderDetails as OrderData } from "../../types/order";
import { AnimatePresence, motion } from "framer-motion";
import { FloatingTipMessage } from "../ui/FloatingTipMessage";
import { analytics } from "../../services/analytics";


export const OrdersDashboard: React.FC = () => {
  const { orderStatuses , user, settings} = useSettings();
  
  // Initialize selectedStatus from localStorage
  const [selectedStatus, setSelectedStatus] = useState<string | null>(() => {
    const cached = localStorage.getItem('selectedOrderStatus');
    return cached ? JSON.parse(cached) : null;
  });
  const { orders, orderPage, isLoading, isRefetching, ordersError, setOrders, refetchOrders, cancelOrdersRefresh } = useAppState(selectedStatus);

  // Update localStorage when selectedStatus changes
  useEffect(() => {
    localStorage.setItem('selectedOrderStatus', JSON.stringify(selectedStatus));
  }, [selectedStatus]);




  const { selectedOrderId, handleOrderSelect, handleReset, handleSearchOrder } = useOrderSelection(orders, setOrders);
  const { markAsCompleted, isCompleted } = useVisitedOrders();
  const {
    generateSuperOrder,
    items: superOrderItems,
    clearSuperOrder,
    isLoading: isGeneratingSuperOrder,
  } = useSuperOrder();

  // Poll only the list view: replacing an open order could discard a draft or
  // close a shipment/printing flow. Returning to the list always refreshes it.
  useEffect(() => {
    if (selectedOrderId) {
      cancelOrdersRefresh();
      return;
    }
    const refresh = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void refetchOrders(true);
      }
    };
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [selectedOrderId, refetchOrders, cancelOrdersRefresh]);

  // Handle browser history
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view === "orders-list") {
        handleReset();
        void refetchOrders(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [handleReset, refetchOrders]);

  // Track page view and identify user when component mounts
 useEffect(() => {
  if (settings && user) {

    // THIS WILL PAS EVERYTHING!! include Tokens, passwords & consumer secrets!
    // analytics.identify('A', {
    //   ...(settings as Record<string, any>),
    //   ...(user.toJSON() as Record<string, any>)
    // });

    analytics.identify(user.email ?? user.uid, ({
      storeUrl: settings.storeUrl,
      authType: settings.authType,
      favicon: settings.favicon,
      myShopifyUrl: settings.myShopifyUrl,
      businessPhone: settings.businessPhone,
      email: user.email,
      uid: user.uid,
    }) as Record<string, any>);
  }

}, []); // Add user to dependency array

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

  const handleBackToList = useCallback((refresh = true) => {
    window.history.pushState({ view: "orders-list" }, "", "/");
    handleReset();
    setIsMobileDetailsVisible(false);
    if (refresh) void refetchOrders(true);
  }, [handleReset, refetchOrders]);

  // Calculate completed orders count
  const completedOrdersCount = useMemo(() => {
    return orders.filter((order) => isCompleted(order.id.toString())).length;
  }, [orders, isCompleted]);

  const handleOrderComplete = (updatedOrder: OrderData) => {
    markAsCompleted(String(updatedOrder.id));
    setOrders((current) => current.map((order) =>
      order.id === updatedOrder.id ? updatedOrder : order
    ));
  };

  const handleOrderSelection = (orderId: string) => {
      if(orderId === selectedOrderId) {
      handleBackToList();
      return;
    } 

    handleOrderSelect(orderId);
  };

  const handleSearchOrdered = (order: OrderData) => {
    handleSearchOrder(order);
  };


  const handleSelectedStatus = (status: string | null) => {
    // Persist the filter for reload; this tab's requests use its own selection.
    localStorage.setItem('selectedOrderStatus', JSON.stringify(status));
    setSelectedStatus(status);
    handleBackToList(status === selectedStatus);

  

    
};


  const renderContent = () => {


    const filteredOrders = selectedStatus
      ? orders.filter(order => order.status === selectedStatus)
      : orders;

 

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
          selectedStatus={selectedStatus}
          loadedCount={orderPage.loadedCount}
          totalOrders={orderPage.total}
          isLoading={isLoading || orderPage.status !== selectedStatus}

        />
        {ordersError && (
          <div role="alert" className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            רשימת ההזמנות לא מעודכנת. לא הצלחנו לקבל נתונים מהחנות.
            {!selectedOrderId && " ננסה שוב אוטומטית."}
            {" אפשר ללחוץ על רענון ההזמנות או לרענן את העמוד."}
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-1 mt-6">
          <div id="orders-sidebar" className={`w-full md:w-1/4 mb-4 md:mb-0 ${isMobileDetailsVisible ? 'hidden md:block' : 'block'}`}>
            <div className="space-y-2 mb-2">
              <OrderSearch onSearch={handleSearchOrdered}/>
              <StatusFilter
                statuses={orderStatuses}
                selectedStatus={selectedStatus}
                onStatusChange={handleSelectedStatus}
              />
              <button
                type="button"
                onClick={() => void refetchOrders(true)}
                disabled={isLoading || isRefetching}
                className="w-full rounded-md border bg-white px-3 py-2 text-sm text-blue-700 disabled:opacity-50"
              >
                {isLoading || isRefetching ? "מעדכן הזמנות…" : "רענון ההזמנות"}
              </button>
            </div>
            <OrdersList
              key={`${settings?.storeUrl ?? ''}:${selectedStatus ?? ''}`}
              orders={filteredOrders}
              onSelectOrder={handleOrderSelection}
              isCompleted={isCompleted}
              selectedOrderId={selectedOrderId}
            />
            <AppInfoStatus />
          </div>
          <div id="orders-details" className={`w-full md:w-3/4 ${isMobileDetailsVisible ||  filteredOrders.length === 0 ? 'block' : 'hidden md:block'}`}>
            {selectedOrder ? (
              <OrderDetails
                key={selectedOrder.id}
                order={selectedOrder}
                onReset={handleBackToList}
                onComplete={handleOrderComplete}
              />
            ) : (
              <div className="flex items-center justify-center h-[800px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mr-5">
                <div className="text-center p-8">

<AnimatePresence mode="wait">
  {isLoading ? (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <LoadingState />
    </motion.div>
  ) : filteredOrders.length === 0 ? (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {ordersError ? (
        <p className="text-amber-800">לא ניתן לטעון את ההזמנות כרגע. הרשימה תעודכן כשהחיבור יתחדש.</p>
      ) : <EmptyState onRefresh={() => void refetchOrders(true)} />}
    </motion.div>
  ) : (
    <motion.div
      key="default"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <svg 
        className="mx-auto h-16 w-16 text-gray-400 bg-gray-200 bg-opacity-75 rounded-full p-3" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
        />
      </svg>
      <h3 className="mt-2 text-xl font-semibold text-gray-900">כאן יופיע פרטי הזמנה | 31.05.26</h3>
      <p className="mt-1 text-sm text-gray-500">בחר הזמנה מהרשימה כדי לצפות בפרטים</p>
    </motion.div>
  )}
</AnimatePresence>

           

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

    <FloatingTipMessage storageKey="keyboard_shortcuts_tip_dismissed" />
    </>
  );
};
