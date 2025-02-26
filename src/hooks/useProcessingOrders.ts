import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { getProcessingOrders } from "../services/orders/orders.service";
import { showErrorToast } from "../utils/error";
import type { OrderSummary } from "../types/order";
import { useSettings } from "./useSettings";

const REFRESH_INTERVAL = 10000; // 10 seconds

export const useProcessingOrders = () => {
  const { settings } = useSettings();


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

      if(!settings){
        setIsLoading(false);
        setIsRefetching(false);
        return;
      }

      try {
        const data = await getProcessingOrders();

        // Compare with previous orders to detect changes
 

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
    [orders.length]
  );

  return {
    orders,
    isLoading,
    isRefetching,
    error,
    refetch: useCallback(() => fetchOrders(), [fetchOrders]),
  };
};
