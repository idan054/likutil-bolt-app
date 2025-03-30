import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OrderHeader } from "./order/OrderHeader";
import { ShippingMethod } from "./order/ShippingMethod";
import { CustomerNote } from "./order/CustomerNote";
import { OrderItems } from "./order/OrderItems";
import { OrderSummary } from "./order/OrderSummary";
import { CustomerSection } from "./customer/CustomerSection";
import { DeliverySelector } from "./delivery/DeliverySelector";
import { OrderNotes } from "./order/notes/OrderNotes";
import { LocalPickupAlert } from "./ui/LocalPickupAlert";
import { useOrderCompletion } from "../hooks/useOrderCompletion";
import { useDeliveryCreation } from "../hooks/useDeliveryCreation";
import { CheckCircle, Loader2, Printer, Truck } from "lucide-react";
import { LocalPickupSection } from "./order/LocalPickupSection";
import { useMessagingStore } from "../store/useMessagingStore";
import type { OrderDetails as OrderDetailType } from '../types/order';


interface OrderDetailsProps {
  order: OrderDetailType;
  onReset: () => void;
  onComplete: () => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  onReset,
  onComplete,
}) => {
  const { reset: resetMessaging } = useMessagingStore();
  const [showLocalPickupAlert, setShowLocalPickupAlert] = useState(false);
  const [showLocalPickup, setShowLocalPickup] = useState<boolean>(true);
  const [selectedDeliveryProvider, setSelectedDeliveryProvider] = useState<
    string | null
  >(null);

  const isLocalPickup = order.shipping_lines[0]?.method_id === "local_pickup";

  const { isCompleting, completeOrder } = useOrderCompletion({
    orderId: order.id,
    onSuccess: () => {
      onComplete();
      onReset();
    },
  });

  const handleComplete = async () => {
    console.log("handleComplete called");
    await completeOrder();
    clearDeliveryResponse();
  };

  const {
    isCreating,
    createDelivery,
    deliveryResponse,
    clearDeliveryResponse,
  } = useDeliveryCreation({
    order,
    provider: selectedDeliveryProvider!,
    onSuccess: () => {}, 
  });

  useEffect(() => {
    resetMessaging();
    if (isLocalPickup) {
      setShowLocalPickupAlert(true);
      setShowLocalPickup(true);
    }
  }, [isLocalPickup, resetMessaging]);



  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="w-full max-w-4xl px-4 sm:px-4"
      >
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6" dir="rtl">
          <OrderHeader
            key={order.id}
            order={order}
            id={order.id}
            status={order.status}
            dateCreated={order.date_created}
            isLocalPickup={isLocalPickup}
            customerId={order.customer_id}
            onReset={onReset}
          />
          <CustomerNote note={order.customer_note} />

      
          
          <OrderItems items={order.line_items} />

          <OrderSummary
            shippingTotal={order.shipping_total}
            paymentMethod={order.payment_method_title}
            total={order.total}
          />

    

          <CustomerSection 
          billing={order.billing}
          shipping={order.shipping}
          
          />
     

          <div className="mt-8">
            <OrderNotes
              key={order.id}
              orderId={order.id.toString()}
              customerPhone={!order.shipping?.phone || order.shipping.phone === '' ? order.billing?.phone : order.shipping.phone}
            />
          </div>

          


          <div className="mt-4 border-t pt-6">

          <ShippingMethod shippingLines={order.shipping_lines} />

            {isLocalPickup && showLocalPickup ? (
              <LocalPickupSection
                paymentMethod={order.payment_method_title}
                isCompleting={isCompleting}
                onComplete={handleComplete}
                onSendAnyway={() => setShowLocalPickup(false)}
              />
            ) : (
              <DeliverySelector
                order={order}
                onSelect={setSelectedDeliveryProvider}
                selectedProvider={selectedDeliveryProvider}
                customerId={order.customer_id}
                isLocalPickup={isLocalPickup}
                isCreating={isCreating}
                onCreateDelivery={(packNum) => createDelivery(packNum)}
                deliveryResponse={deliveryResponse}
                onComplete={handleComplete}
                isCompleting={isCompleting}
              />
            )}
          </div>
        </div>

        {/* <LocalPickupAlert
          isOpen={showLocalPickupAlert}
          onConfirm={() => setShowLocalPickupAlert(false)}
          onCancel={() => setShowLocalPickupAlert(false)}
          orderId={order.id.toString()}
        /> */}


      </motion.div>
    </AnimatePresence>
  );
};
