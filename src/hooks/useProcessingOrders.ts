import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { getProcessingOrders } from "../services/orders/orders.service";
import { showErrorToast } from "../utils/error";
import type { OrderDetails, OrderSummary } from "../types/order";
import { useGetFirebaseMetadata } from "./useGetFirebaseMetadata";
import { apiClient } from "../services/api/client";

const REFRESH_INTERVAL = 10000; // 10 seconds

export const useProcessingOrders = () => {
  const { options } = useGetFirebaseMetadata();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const ordersRef = useRef<OrderSummary[]>([]);

  const fetchOrders = useCallback(
    async () => {
      const isInitialFetch = orders.length === 0;
      isInitialFetch ? setIsLoading(true) : setIsRefetching(true);
      setError(null);

      if(!options){
        setIsLoading(false);
        setIsRefetching(false);
        return;
      }

      try {
        const metadataConfigs = options.map(config => ({
          label_path: config.original_path?.label_path,
          value_path: config.original_path?.value_path,
          parent_path: config.original_path?.parent_path
        }));
        const data = await getProcessingOrders(metadataConfigs);

        setOrders(data);
        ordersRef.current = data;
        setError(null);
      } catch (error) {
        console.error("[useProcessingOrders] Failed to fetch orders:", error);
        showErrorToast(error);
        setError(
          error instanceof Error ? error : new Error("Failed to fetch orders")
        );
        if (isInitialFetch) {
          setOrders([]);
        }
      } finally {
        setIsLoading(false);
        setIsRefetching(false);
      }
    },
    [orders.length, options]
  );



  return {
    orders,
    isLoading,
    isRefetching,
    error,
    refetch: useCallback(() => fetchOrders(), [fetchOrders]),
  };
};
