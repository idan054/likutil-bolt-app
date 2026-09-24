import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { auth } from "../config/firebase";
import { getOrderById } from "../services/orders/orders.service";
import { settingsStorage } from "../services/settings";
import type { CompanyPrintDocuments, OrderDetails } from "../types/order";
import {
  getCompanyPrintActions,
  getCompanyPrintSignature,
  type CompanyPrintAction,
} from "../utils/companyPrint";

const readApproval = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

export const useCompanyPrintDocuments = (order: OrderDetails) => {
  const settings = settingsStorage.get();
  const approvalKey = JSON.stringify([
    "company-print-confirmed",
    auth.currentUser?.uid,
    settings?.authType,
    settings?.storeUrl,
    settings?.myShopifyUrl,
    order.id,
  ]);

  const [documents, setDocuments] = useState<CompanyPrintDocuments | null>(
    order.s3_print ?? null
  );
  const [confirmedSignature, setConfirmedSignature] = useState<string | null>(
    () => readApproval(approvalKey)
  );
  const [openedIds, setOpenedIds] = useState<Set<string>>(() => new Set());
  const [awaitingDeliveryNote, setAwaitingDeliveryNote] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const awaitingRef = useRef(false);
  const leftTabRef = useRef(false);
  const refreshingRef = useRef(false);

  useEffect(() => {
    setDocuments(order.s3_print ?? null);
    setConfirmedSignature(readApproval(approvalKey));
    setOpenedIds(new Set());
    setAwaitingDeliveryNote(false);
    setRefreshError(null);
    awaitingRef.current = false;
    leftTabRef.current = false;
  }, [order.id, order.s3_print, approvalKey]);

  // A new invoice invalidates an earlier confirmation, without storing signed URLs.
  const signature = getCompanyPrintSignature(documents);
  const isBlocked = documents !== null && confirmedSignature !== signature;

  const actions = useMemo(() => getCompanyPrintActions(documents), [documents]);

  const hasCompletePayload = Boolean(
    documents?.delivery_note &&
    documents?.popup &&
    typeof documents.popup.title === "string" &&
    Array.isArray(documents.popup.lines) &&
    Array.isArray(documents.invoices)
  );
  const canConfirm = hasCompletePayload && !awaitingDeliveryNote && actions.every(
    (action) => action.valid && openedIds.has(action.id)
  );

  const onPrint = useCallback((action: CompanyPrintAction) => {
    if (!action.valid) return;
    setOpenedIds((current) => new Set(current).add(action.id));
    if (action.createsDeliveryNote) {
      awaitingRef.current = true;
      leftTabRef.current = false;
      setAwaitingDeliveryNote(true);
      setRefreshError(null);
    }
  }, []);

  const refreshDocuments = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const freshOrder = await getOrderById(String(order.id), true);
      if (!freshOrder.s3_print) {
        setRefreshError("פרטי המסמכים אינם זמינים כרגע. פנו למשרד.");
        return;
      }
      setDocuments(freshOrder.s3_print);
      if (freshOrder.s3_print.delivery_note?.exists) {
        awaitingRef.current = false;
        setAwaitingDeliveryNote(false);
      }
    } catch {
      setRefreshError("לא ניתן לעדכן את פרטי התעודה. נסו לבדוק שוב או פנו למשרד.");
    } finally {
      refreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [order.id]);

  useEffect(() => {
    if (!documents) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && awaitingRef.current) {
        leftTabRef.current = true;
      } else if (document.visibilityState === "visible" && leftTabRef.current) {
        leftTabRef.current = false;
        void refreshDocuments();
      }
    };
    const onFocus = () => {
      if (awaitingRef.current && leftTabRef.current) {
        leftTabRef.current = false;
        void refreshDocuments();
      }
    };
    const onBlur = () => {
      if (awaitingRef.current) leftTabRef.current = true;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [documents, refreshDocuments]);

  useEffect(() => {
    if (!isBlocked) return;
    const keepOrderOpen = (event: PopStateEvent) => {
      event.stopImmediatePropagation();
      window.history.pushState(
        { view: "order-details" }, "", `?order=${order.id}`
      );
    };
    window.addEventListener("popstate", keepOrderOpen, true);
    return () => window.removeEventListener("popstate", keepOrderOpen, true);
  }, [isBlocked, order.id]);

  const confirm = useCallback(() => {
    if (!canConfirm) return;
    try {
      sessionStorage.setItem(approvalKey, signature);
    } catch {
      // The current tab remains confirmed; navigation will ask again.
    }
    setConfirmedSignature(signature);
  }, [approvalKey, canConfirm, signature]);

  return {
    documents,
    actions,
    openedIds,
    isBlocked,
    canConfirm,
    awaitingDeliveryNote,
    isRefreshing,
    refreshError,
    onPrint,
    refreshDocuments,
    confirm,
  };
};
