import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { createDelivery, persistMahirliMetaToOrder } from "../services/delivery/delivery.service";
import {
  getKeysByProgramType,
  useDeliveryIntegrations,
} from "./settings/useDeliveryIntegrations";
import { showErrorToast } from "../utils/error";
import { successMessages } from "../config/messages/success";
// import type { OrderDetails } from '../types/order';
import type { DeliveryTaskResponse, ShipmentState } from "../services/delivery/types";
import { OrderDetails } from "../types/order";
import { DeliveryProgramType } from "../components/settings/tabs/sections/delivery/marketplace/AddDeliveryCompanyCard";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../config/firebase";
import { getReprintLabelUrl, getShipmentLabelUrl } from "../utils/shippingLabel";
import { getDeliveryCity } from "../services/delivery/mappers";
import { settingsStorage } from "../services/settings";
import { isValidDeliveryTaskResponse } from "../services/delivery/validation/response";
import { cancelDeliveryShipment, getShipmentState, ShipmentBlockedError } from "../services/delivery/api/delivery";

interface UseDeliveryCreationProps {
  order?: OrderDetails;
  provider: string;
  onSuccess: (labelOpened: boolean) => void | Promise<void>;
}

export const useDeliveryCreation = ({
  order,
  provider,
  onSuccess,
}: UseDeliveryCreationProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [shipmentBlocked, setShipmentBlocked] = useState(false);
  const [shipmentMessage, setShipmentMessage] = useState("");
  const [checkVersion, setCheckVersion] = useState(0);
  const [shipmentState, setShipmentState] = useState<ShipmentState | null>(null);
  const [additionalRevision, setAdditionalRevision] = useState<string | null>(null);
  const creatingRef = useRef(false);
  const [deliveryResponse, setDeliveryResponse] =
    useState<DeliveryTaskResponse | null>(null);
  const { activeIntegrations } =
    useDeliveryIntegrations();
  const [user] = useAuthState(auth);
  const userId = user?.uid ?? "";
  const settings = settingsStorage.get();
  const orderId = order?.id;
  const responseKey = JSON.stringify(["shipment-result", userId, settings?.authType,
    settings?.storeUrl, settings?.myShopifyUrl, orderId]);
  const checkEnabled = Boolean(orderId && userId);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const shipments = shipmentState?.shipments ?? (shipmentState?.response ? [shipmentState.response] : deliveryResponse ? [deliveryResponse] : []);
  const providerShipments = shipments.filter(shipment => shipment.provider === provider && !shipment.cancelled);
  const pending = shipmentState?.state === 'creating' || shipmentState?.state === 'uncertain' || shipmentState?.state === 'cancelling';
  const isCreationBlocked = isChecking || isCancelling || pending ||
    (shipmentBlocked && !shipmentState?.can_additional) || (providerShipments.length > 0 && !additionalRevision);

  useEffect(() => { setAdditionalRevision(null); }, [provider]);

  useEffect(() => {
    let cancelled = false;
    setDeliveryResponse(null);
    setShipmentState(null);
    setAdditionalRevision(null);
    setShipmentBlocked(false);
    setShipmentMessage("");
    setIsChecking(checkEnabled);
    if (!checkEnabled) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(responseKey) || "null");
      if (isValidDeliveryTaskResponse(saved)) {
        setDeliveryResponse(saved);
      }
    } catch { /* An unavailable/corrupt browser cache must not break loading. */ }
    void getShipmentState(String(orderId), userId).then((state) => {
      if (cancelled) return;
      setShipmentState(state);
      setShipmentBlocked(state.blocked);
      setShipmentMessage(state.state === 'created' ? '' : state.message);
      if (isValidDeliveryTaskResponse(state.response)) {
        setDeliveryResponse(state.response);
        try { sessionStorage.setItem(responseKey, JSON.stringify(state.response)); } catch { /* Optional cache. */ }
        if (!state.response.cancelled) void onSuccessRef.current(false);
      } else {
        setDeliveryResponse(null);
        try { sessionStorage.removeItem(responseKey); } catch { /* Optional cache. */ }
      }
    }).catch((error) => {
      if (!cancelled) {
        setShipmentBlocked(true);
        setShipmentMessage(error instanceof Error ? error.message : "לא ניתן לבדוק את מצב המשלוח. נסו לבדוק שוב.");
      }
    }).finally(() => { if (!cancelled) setIsChecking(false); });
    return () => { cancelled = true; };
  }, [responseKey, orderId, userId, checkEnabled, checkVersion]);

  const createDeliveryTask = async (packNum: string = "1", deliveryType: string) => {
    if (creatingRef.current || isCreationBlocked) return;
    if (!order) {
      toast.error("לא נבחרה הזמנה");
      return;
    }

    // Find selected integration
    const selectedIntegration = activeIntegrations.find(
      (integration) => integration.provider === provider
    );

    if (!selectedIntegration) {
      toast.error("מפתח API חסר");
      return;
    }
    
    const keys = getKeysByProgramType(selectedIntegration);
    
    // Will skip look for keys if UPS
    const isUpsDelivery = selectedIntegration.programType === DeliveryProgramType.UPS;
    if (!isUpsDelivery && (!keys || keys === "")) {
      toast.error(`${selectedIntegration.name} - מפתח API חסר`);
      return;
    }

    creatingRef.current = true;
    setIsCreating(true);

    // Reserve a tab during the user's click; browsers block tabs opened after the API reply.
    const sentCity = getDeliveryCity(order);
    const signedLabelUrl = getReprintLabelUrl(order.s3_label_url, order.id, provider, sentCity);
    let labelTab: Window | null = null;
    try {
      if (signedLabelUrl) labelTab = window.open("about:blank", "_blank");
    } catch {
      // The shipment can still be created and printed from the manual button.
    }
    if (labelTab) {
      try {
        labelTab.opener = null;
        labelTab.document.title = "מכין מדבקת משלוח";
        labelTab.document.body.dir = "rtl";
        labelTab.document.body.textContent = "מקים את המשלוח ומכין מדבקה…";
      } catch {
        // The tab is still available for navigation when the delivery returns.
      }
    }

    try {
      const requestedAt = new Date().toISOString();
      const response = await createDelivery({
        userId,
        order,
        provider,
        keys,
        packNum,
        deliveryType,
        requestedAt,
        additionalShipmentRevision: shipmentState?.can_additional ? shipmentState.revision : undefined,
      });

      const result: DeliveryTaskResponse = {
        print_label: response.print_label, control_panel_link: response.control_panel_link,
        provider: response.provider || provider, track_number: response.track_number,
        id: response.id, task_id: response.task_id, public_id: response.public_id,
        barcode: response.barcode, DeliveryNumber: response.DeliveryNumber, package_count: packNum,
      };

      setDeliveryResponse(result);
      setAdditionalRevision(null);
      // A new confirmation must be read from the server before another intentional send.
      setShipmentState((previous) => ({ state: 'created', blocked: true, message: '', response: result,
        shipments: [...(previous?.shipments ?? []), result] }));
      setShipmentBlocked(true);
      setShipmentMessage("");
      // Keep the confirmed carrier result across refreshes. This contains no
      // API keys and is scoped to user, store, order and carrier.
      try { sessionStorage.setItem(responseKey, JSON.stringify(result)); } catch { /* Printing still works. */ }
      toast.success(successMessages.deliveryCreated);

      let labelOpened = false;
      if (signedLabelUrl) {
        const printUrl = getShipmentLabelUrl(
          order.s3_label_url, order.id, provider, result, packNum, sentCity
        );
        if (!printUrl) {
          labelTab?.close();
          toast.error("המשלוח הוקם, אך לא התקבל מספר תקין למדבקה. אין להקים משלוח נוסף.");
        } else if (!labelTab || labelTab.closed) {
          toast.error("המשלוח הוקם. הדפדפן חסם את המדבקה; לחצו על הדפסת מדבקה.");
        } else {
          try {
            labelTab.location.replace(printUrl);
            labelOpened = true;
          } catch {
            labelTab.close();
            toast.error("המשלוח הוקם. לא ניתן לפתוח את המדבקה אוטומטית; לחצו על הדפסת מדבקה.");
          }
        }
      }

      // Persist Mahir Li delivery identifiers onto the order (best-effort, never blocks).
      if (provider === "mahirLi") {
        await persistMahirliMetaToOrder(order, result, requestedAt);
      }

      await onSuccess(labelOpened);
    } catch (error) {
      labelTab?.close();
      setAdditionalRevision(null);
      setShipmentState(null);
      if (error instanceof ShipmentBlockedError) {
        setShipmentState(error.shipment);
        setShipmentBlocked(true);
        setShipmentMessage(error.message);
        if (isValidDeliveryTaskResponse(error.shipment.response)) {
          setDeliveryResponse(error.shipment.response);
          try { sessionStorage.setItem(responseKey, JSON.stringify(error.shipment.response)); } catch { /* Optional cache. */ }
          if (!error.shipment.response.cancelled) await onSuccess(false);
        } else {
          setDeliveryResponse(null);
          try { sessionStorage.removeItem(responseKey); } catch { /* Optional cache. */ }
        }
      } else {
        // A lost HTTP response is not proof that the carrier rejected the task.
        setShipmentBlocked(true);
        setShipmentMessage("לא התקבל אישור סופי. יש לבדוק את מצב המשלוח לפני ניסיון נוסף.");
      }
      showErrorToast(error);
    } finally {
      creatingRef.current = false;
      setIsCreating(false);
    }
  };

  const clearDeliveryResponse = () => {
    setDeliveryResponse(null);
    try { sessionStorage.removeItem(responseKey); } catch { /* Optional browser cache. */ }
  };

  const cancelShipment = async (shipment: DeliveryTaskResponse): Promise<boolean> => {
    if (creatingRef.current || isChecking || !orderId || !shipmentState?.revision) return false;
    creatingRef.current = true;
    setIsCancelling(true);
    setShipmentMessage('');
    setAdditionalRevision(null);
    try {
      const state = await cancelDeliveryShipment(String(orderId), userId, shipment, shipmentState.revision);
      setShipmentState(state);
      setShipmentBlocked(state.blocked);
      setDeliveryResponse(state.response);
      try { sessionStorage.removeItem(responseKey); } catch { /* Optional cache. */ }
      const cancelled = state.shipments?.some(item => item.provider === shipment.provider &&
        String(item.track_number) === String(shipment.track_number) && item.cancelled);
      if (!cancelled) throw new Error('מצב המשלוח השתנה. יש לבדוק שוב את אישור הביטול.');
      toast.success('המשלוח בוטל. לא הופק משלוח נוסף.');
      return true;
    } catch (error) {
      if (error instanceof ShipmentBlockedError) {
        setShipmentState(error.shipment);
        setShipmentBlocked(error.shipment.blocked);
      }
      setShipmentMessage(error instanceof Error ? error.message : 'לא התקבל אישור ביטול. יש לבדוק מצב משלוח.');
      showErrorToast(error);
      setCheckVersion(version => version + 1);
      return false;
    } finally {
      creatingRef.current = false;
      setIsCancelling(false);
    }
  };

  return {
    isCreating,
    isCancelling,
    isCreationBlocked,
    isChecking,
    shipmentMessage,
    checkShipment: () => { if (!creatingRef.current) { setIsChecking(true); setCheckVersion((version) => version + 1); } },
    createDelivery: createDeliveryTask,
    deliveryResponse: additionalRevision || isChecking ? null : [...providerShipments].reverse().find(shipment => shipment.status_checked !== false && isValidDeliveryTaskResponse(shipment)) ?? null,
    previousShipments: shipments,
    canRequestAdditional: !isChecking && !isCreating && !isCancelling && Boolean(shipmentState?.can_additional && shipmentState.revision),
    isAdditional: Boolean(additionalRevision),
    requestAdditional: () => {
      if (!creatingRef.current && !isChecking && shipmentState?.can_additional && shipmentState.revision) {
        setAdditionalRevision(shipmentState.revision);
      }
    },
    cancelAdditional: () => { if (!creatingRef.current) setAdditionalRevision(null); },
    cancelShipment,
    clearDeliveryResponse,
  };
};
