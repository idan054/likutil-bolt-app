import { useEffect, useState } from "react";
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
  const [deliveryResponse, setDeliveryResponse] =
    useState<DeliveryTaskResponse | null>(null);
  const { activeIntegrations } =
    useDeliveryIntegrations();
  const [user] = useAuthState(auth);

  useEffect(() => {
    clearDeliveryResponse();
  }, [order?.id]);

  const createDeliveryTask = async (packNum: string = "1", deliveryType: string) => {
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

    setIsCreating(true);

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

      // Persist Mahir Li delivery identifiers onto the order (best-effort, never blocks).
      if (provider === "mahirLi") {
        await persistMahirliMetaToOrder(order, result, requestedAt);
      }

      onSuccess();
    } catch (error) {
      showErrorToast(error);
    } finally {
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

