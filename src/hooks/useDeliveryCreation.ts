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
import type { DeliveryTaskResponse } from "../services/delivery/types";
import { OrderDetails } from "../types/order";
import { DeliveryProgramType } from "../components/settings/tabs/sections/delivery/marketplace/AddDeliveryCompanyCard";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../config/firebase";
import { getReprintLabelUrl, getShipmentLabelUrl } from "../utils/shippingLabel";
import { getDeliveryCity } from "../services/delivery/mappers";

interface UseDeliveryCreationProps {
  order?: OrderDetails;
  provider: string;
  onSuccess: () => void;
}

export const useDeliveryCreation = ({
  order,
  provider,
  onSuccess,
}: UseDeliveryCreationProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const creatingRef = useRef(false);
  const [deliveryResponse, setDeliveryResponse] =
    useState<DeliveryTaskResponse | null>(null);
  const { activeIntegrations } =
    useDeliveryIntegrations();
  const [user] = useAuthState(auth);

  useEffect(() => {
    clearDeliveryResponse();
  }, [order?.id, provider]);

  const createDeliveryTask = async (packNum: string = "1", deliveryType: string) => {
    if (creatingRef.current) return;
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
    const userId = user?.uid ?? "";
    
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
      const result = await createDelivery({
        userId,
        order,
        provider,
        keys,
        packNum,
        deliveryType,
        requestedAt
      });

      setDeliveryResponse(result);
      toast.success(successMessages.deliveryCreated);

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

      onSuccess();
    } catch (error) {
      labelTab?.close();
      showErrorToast(error);
    } finally {
      creatingRef.current = false;
      setIsCreating(false);
    }
  };

  const clearDeliveryResponse = () => {
    setDeliveryResponse(null);
  };

  return {
    isCreating,
    createDelivery: createDeliveryTask,
    deliveryResponse,
    clearDeliveryResponse,
  };
};

