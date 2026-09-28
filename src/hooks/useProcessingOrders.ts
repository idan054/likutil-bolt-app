import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getFilteredOrdersPage, type OrdersPage } from "../services/orders/orders.service";
import type { OrderSummary } from "../types/order";
import { useSettings } from "./useSettings";
import { useGetFirebaseMetadata } from "./useGetFirebaseMetadata";

const CACHE_DURATION = 30 * 1000;
const REQUEST_TIMEOUT = 20 * 1000;

export const useProcessingOrders = (selectedStatus?: string | null) => {
  const { settings, user } = useSettings();
  const { options } = useGetFirebaseMetadata();
  const scope = settings ? JSON.stringify([
    user?.uid, settings.authType, settings.storeUrl, settings.myShopifyUrl,
  ]) : null;
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const metadataConfigs = useMemo(() => options.map((config) => ({
    label_path: config.original_path?.label_path,
    value_path: config.original_path?.value_path,
    parent_path: config.original_path?.parent_path,
  })), [options]);

  const [orders, setOrdersState] = useState<OrderSummary[]>([]);
  const [orderPage, setOrderPage] = useState<Pick<OrdersPage, "total" | "status"> & { loadedCount: number }>({
    total: null, status: null, loadedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const ordersRef = useRef<OrderSummary[]>([]);
  const lastFetchedRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelRefresh = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
    setIsRefetching(false);
  }, []);

  const setOrders = useCallback((update: React.SetStateAction<OrderSummary[]>) => {
    const next = typeof update === "function" ? update(ordersRef.current) : update;
    ordersRef.current = next;
    setOrdersState(next);
  }, []);

  const applyOrderPage = useCallback((page: OrdersPage) => {
    setOrders(page.orders);
    setOrderPage({ total: page.total, status: page.status, loadedCount: page.orders.length });
    lastFetchedRef.current = Date.now();
    setError(null);
  }, [setOrders]);

  const fetchOrders = useCallback(async (force = false) => {
    if (!scope || !isMountedRef.current) {
      setIsLoading(false);
      setIsRefetching(false);
      return;
    }
    if (!force && abortControllerRef.current) return;
    if (!force && lastFetchedRef.current !== null &&
        Date.now() - lastFetchedRef.current < CACHE_DURATION) return ordersRef.current;

    // A forced refresh supersedes pending reads, including reads for an old filter.
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const isCurrent = () => isMountedRef.current && scopeRef.current === scope &&
      abortControllerRef.current === controller;
    const isInitialFetch = lastFetchedRef.current === null;
    setIsLoading(isInitialFetch);
    setIsRefetching(!isInitialFetch);
    // Keep the warning until fresh data has actually arrived.
    const timeout = setTimeout(() => controller.abort(new DOMException(
      "טעינת ההזמנות ארכה זמן רב מדי. יש לנסות לרענן שוב.", "TimeoutError"
    )), REQUEST_TIMEOUT);

    try {
      const data = await getFilteredOrdersPage(selectedStatus === undefined ? "init" : selectedStatus, metadataConfigs, undefined, {
        forceRefresh: true,
        signal: controller.signal,
      });
      if (!isCurrent() || controller.signal.aborted) return;
      applyOrderPage(data);
      return data.orders;
    } catch (failure) {
      if (!isCurrent() || (controller.signal.aborted &&
          controller.signal.reason?.name !== "TimeoutError")) return;
      setError(failure instanceof Error ? failure : new Error("טעינת ההזמנות נכשלה"));
      // Never replace the last known list with an empty list on failure.
      return ordersRef.current;
    } finally {
      clearTimeout(timeout);
      if (isCurrent()) {
        abortControllerRef.current = null;
        setIsLoading(false);
        setIsRefetching(false);
      }
    }
  }, [scope, selectedStatus, metadataConfigs, applyOrderPage]);

  useEffect(() => {
    isMountedRef.current = true;
    lastFetchedRef.current = null;
    setOrders([]);
    setOrderPage({ total: null, status: null, loadedCount: 0 });
    setError(null);
    void fetchOrders();
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [fetchOrders, setOrders]);

  return {
    orders, setOrders, orderPage, applyOrderPage, isLoading, isRefetching, error,
    fetchOrders, refetch: fetchOrders, cancelRefresh, lastFetched: lastFetchedRef.current,
  };
};
