import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { getProcessingOrders } from "../services/orders/orders.service";
import { showErrorToast } from "../utils/error";
import type { OrderSummary } from "../types/order";

const REFRESH_INTERVAL = 10000; // 10 seconds

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
            const toastId = "new-orders";
            toast.success(`יש ${newOrdersCount} הזמנות חדשות! מומלץ לרענן`, {
              id: toastId,
              // duration: Infinity,
              icon: "🔄",
              style: {
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              },
              className: 'toast-hover'
            });

            // Add click event listener to the toast element and hover styles
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
              // Add hover effect styles
              const style = document.createElement('style');
              style.textContent = `
                .toast-hover:hover {
                  background-color: rgba(0, 255, 0, 0.1) !important;
                }
              `;
              document.head.appendChild(style);

              toastElement.addEventListener('click', () => {

              console.log('XXX')  

                setOrders(data);
                ordersRef.current = data;
                setIsLoading(false);
                setIsRefetching(false);
                toast.dismiss(toastId);
              });
            }
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


  // Setup periodic refresh with initial delay
  useEffect(() => {
    // Initial delay of 30 seconds before starting the interval
    const startupDelay = setTimeout(() => {
      console.log('Starting periodic order refresh...');
      
      const intervalId = setInterval(() => {
        fetchOrders(true); // Show notification on background updates
      }, REFRESH_INTERVAL);

      return () => clearInterval(intervalId);
    }, 15000); // 15 seconds delay

    // Cleanup both the delay and interval
    return () => clearTimeout(startupDelay);
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
