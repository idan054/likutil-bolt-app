import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { getProcessingOrders } from "../services/orders/orders.service";
import { showErrorToast } from "../utils/error";
import type { OrderSummary } from "../types/order";

const REFRESH_INTERVAL = 5000; // 5 seconds

export const useProcessingOrders = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const ordersRef = useRef<OrderSummary[]>([]);

  const fetchOrders = useCallback(
    async (showNotification = false) => {
      const isInitialFetch = orders.length === 0;
      isInitialFetch ? setIsLoading(true) : setIsRefetching(true);
      setError(null);

      // Don't fetch if settings are not available
      const settingsStr = localStorage.getItem("wc_settings");
      if (!settingsStr) {
        if (isInitialFetch) {
          setOrders([]);
        }
        setIsLoading(false);
        setIsRefetching(false);
        return;
      }

      try {
        const data = await getProcessingOrders();

        // Compare with previous orders to detect changes
        if (showNotification && ordersRef.current.length > 0) {
          const newOrdersCount = data.length - ordersRef.current.length;
          if (newOrdersCount > 0) {
            toast.success(`יש ${newOrdersCount} הזמנות חדשות! לחץ לרענון`, {
              id: "new-orders",
              duration: 5000,
              icon: "🔄",
              onClick: () => {
                setOrders(data);
                ordersRef.current = data;
                setIsLoading(false);
                setIsRefetching(false);
              },
            });
            return;
          }
        }

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

  // Initial fetch
  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  // Setup periodic refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchOrders(true); // Show notification on background updates
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "wc_settings") {
        fetchOrders(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    isRefetching,
    error,
    refetch: useCallback(() => fetchOrders(false), [fetchOrders]),
  };
};
