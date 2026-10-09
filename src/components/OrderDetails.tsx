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
import { FastDeliveryDecisionCard } from "./fastDelivery/FastDeliveryDecisionCard";
import { LocalPickupAlert } from "./ui/LocalPickupAlert";
import { useOrderCompletion } from "../hooks/useOrderCompletion";
import { useDeliveryCreation } from "../hooks/useDeliveryCreation";
import { LocalPickupSection } from "./order/LocalPickupSection";
import { useMessagingStore } from "../store/useMessagingStore";
import { useOrderFastDeliveryDecision } from "../hooks/useOrderFastDeliveryDecision";
import { SITE_DECISION_MARK, providerForSiteCarrier, siteBlockedProviders } from "../utils/siteCarrier";
import type { OrderDetails as OrderDetailType } from "../types/order";
import {
  isCashPaymentMethod,
  isLocalPickupShipping,
  isOtherPaymentProcessing,
} from "../utils/order";
import { OrderStatusOverrideMenu } from "./order/OrderStatusOverrideMenu";
import { CompanyPrintDocuments } from "./order/CompanyPrintDocuments";
import { useCompanyPrintDocuments } from "../hooks/useCompanyPrintDocuments";
import { isPickingStatus } from "../services/orders/eligibility";
import { settingsStorage } from "../services/settings";
import { markOrderShipmentCreated } from "../services/orders/orders.service";

interface OrderDetailsProps {
  order: OrderDetailType;
  onReset: () => void;
  onComplete: (updatedOrder?: any) => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  onReset,
  onComplete,
}) => {
  


  const { reset: resetMessaging } = useMessagingStore();
  const companyPrint = useCompanyPrintDocuments(order);
  const [showLocalPickupAlert, setShowLocalPickupAlert] = useState(false);
  const [showLocalPickup, setShowLocalPickup] = useState<boolean>(true);
  const [selectedDeliveryProvider, setSelectedDeliveryProvider] = useState<
    string | null
  >(null);

  const isLocalPickup = isLocalPickupShipping(order.shipping_lines);
  const shouldWarnForCashPickup = isLocalPickup && isCashPaymentMethod(
    order.payment_method_title,
    order.payment_method
  );

  // Get fast delivery decision for auto-selecting mahirLi
  const { decision } = useOrderFastDeliveryDecision(order);
  const [shipmentOrder, setShipmentOrder] = useState<OrderDetailType | null>(null);
  const [shipmentStatusError, setShipmentStatusError] = useState(false);
  const [isUpdatingShipment, setIsUpdatingShipment] = useState(false);
  const updatingShipment = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const syncShipmentStatus = async (closeAfterSuccess = false) => {
    if (updatingShipment.current) return;
    updatingShipment.current = true;
    setIsUpdatingShipment(true);
    setShipmentStatusError(false);
    try {
      const updated = await markOrderShipmentCreated(String(order.id));
      if (!active.current) return;
      setShipmentOrder(updated);
      onComplete(updated);
      if (closeAfterSuccess && !companyPrint.isBlocked) onReset();
    } catch {
      if (active.current) setShipmentStatusError(true);
    } finally {
      updatingShipment.current = false;
      if (active.current) setIsUpdatingShipment(false);
    }
  };

  const { isCompleting, completeOrder } = useOrderCompletion({
    orderId: order.id,
    onSuccess: (updatedOrder) => {
      onComplete(updatedOrder);
      onReset();
    },
  });

  const handleComplete = async () => {
    if (companyPrint.isBlocked) return;
    if (deliveryResponse) {
      if (shipmentOrder) onReset();
      else await syncShipmentStatus(true);
      return;
    }
    await completeOrder();
    // Success closes this view through onSuccess. On failure keep the existing
    // shipment and label available, so retrying completion cannot recreate it.
  };

  const handleStatusChanged = () => {
    clearDeliveryResponse();
    onReset();
  };

  const {
    isCreating,
    createDelivery,
    deliveryResponse,
    isChecking,
    isCreationBlocked,
    shipmentMessage,
    shipmentState,
    isCancelling,
    cancelShipment,
    previousShipments,
    canRequestAdditional,
    isAdditional,
    requestAdditional,
    cancelAdditional,
    checkShipment,
    clearDeliveryResponse,
  } = useDeliveryCreation({
    order,
    provider: selectedDeliveryProvider!,
    onSuccess: syncShipmentStatus,
  });

  useEffect(() => {
    // Reset provider when order changes
    setSelectedDeliveryProvider(null);
  }, [order.id]);

  // The site decides which courier the order should use (order.s3_carrier) and that card is preselected;
  // the picker can still choose another. Without a site decision the old rule applies: fast -> mahirLi.
  // An order that already has a live shipment keeps that courier selected, so the picker sees it.
  const siteProvider = providerForSiteCarrier(order.s3_carrier?.use);
  const existingShipmentProvider = previousShipments.find((shipment) => !shipment.cancelled)?.provider ?? null;
  // The old rule must not preselect Mahir Li for a town the site says it does not reach.
  const mahirLiBlocked = Boolean(siteBlockedProviders(order.s3_carrier).mahirLi);
  // The site stops sending a decision once a shipment is opened; the saved decision still says it came from the site.
  const decidedBySite = Boolean(siteProvider) || decision?.rulesUpdatedAt === SITE_DECISION_MARK;
  useEffect(() => {
    if (selectedDeliveryProvider) return;
    const oldRuleProvider = decision?.deliveryType === 'fast' && !mahirLiBlocked ? 'mahirLi' : null;
    if (decidedBySite) {
      if (isChecking) return;
      const next = existingShipmentProvider ?? siteProvider ?? oldRuleProvider;
      if (next) setSelectedDeliveryProvider(next);
    } else if (oldRuleProvider) {
      setSelectedDeliveryProvider(oldRuleProvider);
    }
  }, [decision?.deliveryType, selectedDeliveryProvider, siteProvider, decidedBySite, isChecking, existingShipmentProvider, mahirLiBlocked]);

  useEffect(() => {
    resetMessaging();
    if (isLocalPickup) {
      setShowLocalPickupAlert(true);
      setShowLocalPickup(true);
    }
  }, [isLocalPickup, resetMessaging]);

  const isOtherPaymentProcessingOrder = isOtherPaymentProcessing(
    order.status,
    order.payment_method_title,
    order.payment_method
  );

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
        <div
          className={`rounded-lg shadow-lg p-4 sm:p-6 ${
            isOtherPaymentProcessingOrder
              ? "bg-amber-50 border border-amber-200"
              : "bg-white"
          }`}
          dir="rtl"
        >
          <OrderHeader
            key={`${order.id}:${shipmentOrder?.status ?? order.status}`}
            order={order}
            id={order.id}
            order_number={order.order_number}
            status={shipmentOrder?.status ?? order.status}
            dateCreated={order.date_created}
            isLocalPickup={isLocalPickup}
            customerId={order.customer_id}
            onReset={() => {
              if (!companyPrint.isBlocked) onReset();
            }}
            beforeStatusChange={(newStatus) =>
              newStatus !== "completed" || !companyPrint.isBlocked
            }
            onStatusUpdate={(newStatus) => {
              // Revoking fulfillment ends the workflow even if documents remain unprinted.
              if (!isPickingStatus(newStatus, settingsStorage.get()?.authType)) onReset();
            }}
          />
          <CompanyPrintDocuments order={order} print={companyPrint} />
          {shipmentStatusError && (
            <div role="alert" className="my-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              המשלוח כבר נוצר, אך סטטוס ההזמנה לא עודכן. אין ליצור משלוח נוסף.
              <button className="mr-2 font-semibold underline" onClick={() => void syncShipmentStatus(false)} disabled={isUpdatingShipment}>
                נסה לעדכן סטטוס שוב
              </button>
            </div>
          )}
          <FastDeliveryDecisionCard order={order} />

          <CustomerNote note={order.customer_note} />

          <OrderItems items={order.line_items} />

          <OrderSummary
            shippingTotal={order.shipping_total}
            paymentMethod={order.payment_method_title}
            total={order.total}
          />

          <CustomerSection billing={order.billing} shipping={order.shipping} />

          <div className="mt-8">
            <OrderNotes
              key={order.id}
              orderId={order.id.toString()}
              order_number={`${order.order_number}`}
              order={order}
              customerPhone={
                !order.shipping?.phone || order.shipping.phone === ""
                  ? order.billing?.phone
                  : order.shipping.phone
              }
            />
          </div>

          <div className="mt-4 border-t pt-6">
            <ShippingMethod shippingLines={order.shipping_lines} />
            {!isLocalPickup || !showLocalPickup ? (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                <div className="text-sm font-semibold text-amber-900">
                  שינוי סטטוס ידני
                </div>
                <OrderStatusOverrideMenu
                  order={order}
                  isDisabled={isCompleting || isCreating || isUpdatingShipment || isCancelling}
                  onStatusChanged={handleStatusChanged}
                />
              </div>
            ) : null}

            {isLocalPickup && showLocalPickup ? (
              <LocalPickupSection
                order={order}
                paymentMethod={order.payment_method_title}
                showCashWarning={shouldWarnForCashPickup}
                isCompleting={isCompleting || isUpdatingShipment}
                onComplete={handleComplete}
                onSendAnyway={() => setShowLocalPickup(false)}
                onStatusChanged={handleStatusChanged}
              />
            ) : (
              <DeliverySelector
                order={order}
                onSelect={setSelectedDeliveryProvider}
                selectedProvider={selectedDeliveryProvider}
                customerId={order.customer_id}
                isLocalPickup={isLocalPickup}
                isCreating={isCreating || isUpdatingShipment || isCancelling}
                isCreationBlocked={isCreationBlocked}
                shipments={previousShipments}
                isChecking={isChecking}
                shipmentMessage={shipmentMessage}
                shipmentState={shipmentState}
                canRequestAdditional={canRequestAdditional}
                isAdditional={isAdditional}
                onRequestAdditional={requestAdditional}
                onCancelAdditional={cancelAdditional}
                onCancelShipment={cancelShipment}
                onCheckShipment={checkShipment}
                onCreateDelivery={(packNum, deliveryType) => createDelivery(packNum, deliveryType)}
                deliveryResponse={deliveryResponse}
                onComplete={handleComplete}
                isCompleting={isCompleting || isUpdatingShipment}
                onStatusChanged={handleStatusChanged}
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
