import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-hot-toast";
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
import { getFilteredOrders } from "../../services/orders/orders.service";
import { filter } from "framer-motion/client";
// import { OrderDetails } from '../../types/order';
import { AnimatePresence, motion } from "framer-motion";
import { useDeliveryCreation } from "../../hooks/useDeliveryCreation";
import { FloatingTipMessage } from "../ui/FloatingTipMessage";
import { analytics, AnalyticsEvent } from "../../services/analytics";
import { se } from "date-fns/locale";


interface OrdersDashboardProps {
  
}

export const OrdersDashboard: React.FC<OrdersDashboardProps> = () => {
  const { orders, isLoading, isRefetching, setOrders } = useAppState();
  const { orderStatuses , user, settings} = useSettings();
  
  // Initialize selectedStatus from localStorage
  const [selectedStatus, setSelectedStatus] = useState<string | null>(() => {
    const cached = localStorage.getItem('selectedOrderStatus');
    return cached ? JSON.parse(cached) : null;
  });

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

  const {
    clearDeliveryResponse,
  } = useDeliveryCreation({
    order: undefined,
    provider: '',
    onSuccess: () => {}, 
  });


  const handleOrderSelection = (orderId: string) => {
      if(orderId === selectedOrderId) {
      handleBackToList();
      return;
    } 

    handleOrderSelect(orderId);
  };

  const handleSearchOrdered = (order: any) => {
    handleSearchOrder(order);
  };


  const handleSelectedStatus = (status: string | null) => {
    setSelectedStatus(status);
    
    toast.promise(
      getFilteredOrders(status),
      {
        loading: `מעדכן רשימת הזמנות ${status ?? ''}...`,

        success: (data) => {
          setOrders(data);
          return `${data.length} הזמנות אחרונות נוספו בהצלחה`;
        },
        error: 'Failed to refresh orders'
      }
    );

    
    handleBackToList();

  

    
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
          isRefetching={isRefetching}
          selectedStatus={selectedStatus}

        />
        <div className="flex flex-col md:flex-row gap-1 mt-6">
          <div id="orders-sidebar" className={`w-full md:w-1/4 mb-4 md:mb-0 ${isMobileDetailsVisible ? 'hidden md:block' : 'block'}`}>
            <div className="space-y-2 mb-2">
              <OrderSearch onSearch={handleSearchOrdered}/>
              <StatusFilter
                statuses={orderStatuses}
                selectedStatus={selectedStatus}
                onStatusChange={handleSelectedStatus}
              />
            </div>
            <OrdersList
              key={filteredOrders.length}
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
                order={selectedOrder}
                onReset={handleBackToList}
                onComplete={() => handleOrderComplete(selectedOrderId)}
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
      <EmptyState onRefresh={() => {
        toast.promise(
          getFilteredOrders(selectedStatus),
          {
            loading: 'Refreshing orders...',
            success: (data) => {
              setOrders(data);
              return 'Orders refreshed successfully';
            },
            error: 'Failed to refresh orders'
          }
        );
      }} />
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
