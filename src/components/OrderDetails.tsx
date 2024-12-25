import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrderDetails as OrderDetailsType } from '../types/order';
import type { DeliveryProvider } from './delivery/DeliverySelector';
import { OrderHeader } from './order/OrderHeader';
import { ShippingMethod } from './order/ShippingMethod';
import { CustomerNote } from './order/CustomerNote';
import { OrderItems } from './order/OrderItems';
import { OrderSummary } from './order/OrderSummary';
import { CustomerSection } from './customer/CustomerSection';
import { DeliverySelector } from './delivery/DeliverySelector';
import { OrderNotes } from './order/notes/OrderNotes';
import { LocalPickupAlert } from './ui/LocalPickupAlert';
import { useOrderCompletion } from '../hooks/useOrderCompletion';
import { useDeliveryCreation } from '../hooks/useDeliveryCreation';

interface OrderDetailsProps {
  order: OrderDetailsType;
  onReset: () => void;
  onComplete: () => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ 
  order, 
  onReset,
  onComplete 
}) => {
  const [showLocalPickupAlert, setShowLocalPickupAlert] = useState(false);
  const [selectedDeliveryProvider, setSelectedDeliveryProvider] = useState<DeliveryProvider | null>(null);
  
  const isLocalPickup = order.shipping_lines[0]?.method_id === 'local_pickup';

  const { isCompleting, completeOrder } = useOrderCompletion({
    orderId: order.id,
    onSuccess: () => {
      onComplete();
      onReset();
    },
  });

  const { 
    isCreating, 
    createDelivery,
    deliveryResponse,
    clearDeliveryResponse,
  } = useDeliveryCreation({
    order,
    provider: selectedDeliveryProvider!,
    onSuccess: () => {}, // Success is handled by the response display
  });

  useEffect(() => {
    if (isLocalPickup) {
      setShowLocalPickupAlert(true);
    }
  }, [isLocalPickup]);

  const handleComplete = async () => {
    await completeOrder();
    clearDeliveryResponse();
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className="w-full max-w-4xl mx-auto px-4 sm:px-6"
      >
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6" dir="rtl">
          <OrderHeader
            id={order.id}
            status={order.status}
            dateCreated={order.date_created}
            isLocalPickup={isLocalPickup}
            customerId={order.customer_id}
            onReset={onReset}
          />
          <CustomerNote note={order.customer_note} />
          <ShippingMethod shippingLines={order.shipping_lines} />
          <OrderItems items={order.line_items} />
          <CustomerSection billing={order.billing} />
          <OrderSummary
            shippingTotal={order.shipping_total}
            paymentMethod={order.payment_method_title}
            total={order.total}
          />
          
          <div className="mt-8">
            <OrderNotes orderId={order.id.toString()} />
          </div>

          <div className="mt-4 border-t pt-6">
            <DeliverySelector
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
          </div>
        </div>
        
        <LocalPickupAlert
          isOpen={showLocalPickupAlert}
          onConfirm={() => setShowLocalPickupAlert(false)}
          onCancel={() => setShowLocalPickupAlert(false)}
          orderId={order.id.toString()}
        />
      </motion.div>
    </AnimatePresence>
  );
};