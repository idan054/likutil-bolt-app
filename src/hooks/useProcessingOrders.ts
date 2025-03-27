import { useState, useEffect, useCallback, useRef } from "react";
import { getProcessingOrders } from "../services/orders/orders.service";
import { showErrorToast } from "../utils/error";
import type { OrderSummary } from "../types/order";
import { useSettings } from "./useSettings";
import { useGetFirebaseMetadata } from "./useGetFirebaseMetadata";

// Cache duration in milliseconds (30 seconds)
const CACHE_DURATION = 30 * 1000;

export const useProcessingOrders = () => {
  const { settings } = useSettings();
  const { options } = useGetFirebaseMetadata();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to store orders without creating dependencies
  const ordersRef = useRef<OrderSummary[]>([]);

  // Track when orders were last fetched
  const lastFetchedRef = useRef<number | null>(null);

  // Use ref to track if a fetch is in progress to prevent duplicate calls
  const isFetchingRef = useRef(false);

  // Track if component is mounted
  const isMountedRef = useRef(true);

  // Abort controller for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOrders = useCallback(
    async (force = false) => {
      // Skip if settings or options are not loaded
      if (!settings || !options) {
        setIsLoading(false);
        setIsRefetching(false);
        return;
      }

      // If a fetch is already in progress, don't start another one
      if (isFetchingRef.current) return;

      // Don't refetch if we recently fetched, unless force=true
      const now = Date.now();
      if (
        !force &&
        lastFetchedRef.current &&
        now - lastFetchedRef.current < CACHE_DURATION &&
        ordersRef.current.length > 0
      ) {
        return ordersRef.current;
      }

      const isInitialFetch = ordersRef.current.length === 0;

      // Only update loading states if component is mounted
      if (isMountedRef.current) {
        if (isInitialFetch) {
          setIsLoading(true);
        } else {
          setIsRefetching(true);
        }
        setError(null);
      }

      try {
        // Set fetching flag to true before making the API call
        isFetchingRef.current = true;

        // Cancel any existing request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        console.log("[useProcessingOrders] Fetching orders...");

        // Prepare metadata configs from Firebase options
        const metadataConfigs = options.map((config) => ({
          label_path: config.original_path?.label_path,
          value_path: config.original_path?.value_path,
          parent_path: config.original_path?.parent_path,
        }));

        // Pass metadata configs to getProcessingOrders
        const data = await getProcessingOrders(metadataConfigs);

        // Record the fetch time
        lastFetchedRef.current = Date.now();

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setOrders(data);
          ordersRef.current = data;
          setError(null);
        }

        // Return the data for direct use if needed
        return data;
      } catch (error) {
        // Only handle error if it's not an abort error
        if (error instanceof DOMException && error.name === "AbortError") {
          console.log("[useProcessingOrders] Request was aborted");
          return ordersRef.current;
        }

        console.error("[useProcessingOrders] Failed to fetch orders:", error);

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          showErrorToast(error);
          setError(
            error instanceof Error ? error : new Error("Failed to fetch orders")
          );
          if (isInitialFetch) {
            setOrders([]);
          }
        }

        return ordersRef.current;
      } finally {
        // Reset fetching flag when done
        isFetchingRef.current = false;

        // Only update loading states if component is still mounted
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRefetching(false);
        }
      }
    },
    [settings, options]
  ); // Depend on settings and options

  // Fetch orders on mount and clean up on unmount
  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    fetchOrders();

    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchOrders]);

  return {
    orders,
    setOrders,
    isLoading,
    isRefetching,
    error,
    fetchOrders,
    refetch: useCallback((force = false) => fetchOrders(force), [fetchOrders]),
    lastFetched: lastFetchedRef.current,
  };
};
