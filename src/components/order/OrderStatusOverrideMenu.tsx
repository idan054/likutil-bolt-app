import React, { useMemo, useState } from "react";
import { ChevronDown, Loader2, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import type { OrderDetails } from "../../types/order";
import { updateOrderStatus } from "../../services/orders/orders.service";
import { createOrderNote } from "../../services/orders/notes.service";
import { showErrorToast } from "../../utils/error";
import { isOtherPaymentMethod } from "../../utils/order";

interface StatusOption {
  value: string;
  label: string;
  note: string;
}

interface OrderStatusOverrideMenuProps {
  order: OrderDetails;
  isDisabled?: boolean;
  onStatusChanged?: () => void;
}

export const OrderStatusOverrideMenu: React.FC<OrderStatusOverrideMenuProps> = ({
  order,
  isDisabled = false,
  onStatusChanged,
}) => {
  if (!isOtherPaymentMethod(order.payment_method_title, order.payment_method)) {
    return null;
  }

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<StatusOption | null>(
    null
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = useMemo<StatusOption[]>(
    () => [
      {
        value: "wc-acounting", // Uses custom AJAX endpoint to bypass REST API
        label: "טרם שולם",
        note:
          "נשלח ללקוח יש לעקוב על החיוב של הלקוח הועבר לסטטוס טרם שולם",
      },
      {
        value: "on-hold",
        label: "בהשהיה",
        note: "הועבר לסטטוס בהשהיה",
      },
    ],
    []
  );

  const resetModal = () => {
    setSelectedOption(null);
  };

  const handleSelectOption = (option: StatusOption) => {
    if (isDisabled || isUpdating) return;
    setSelectedOption(option);
    setIsMenuOpen(false);
  };

  const handleConfirm = async () => {
    if (!selectedOption) return;
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await updateOrderStatus(order.id.toString(), selectedOption.value);
      await createOrderNote(
        order.id.toString(),
        { note: selectedOption.note, customer_note: true },
        order
      );
      toast.success(`הסטטוס עודכן ל-${selectedOption.label}`);
      onStatusChanged?.();
      resetModal();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isConfirmEnabled = !isUpdating && !isDisabled;

  return (
    <div className="relative inline-flex" dir="rtl">
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        disabled={isDisabled || isUpdating}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        className={`flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 ${
          isMenuOpen ? "ring-2 ring-amber-200" : ""
        }`}
      >
        <span>סטטוס אחר</span>
        {isUpdating ? (
          <Loader2 className="animate-spin" size={14} />
        ) : (
          <ChevronDown
            size={14}
            className={`transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-amber-100 bg-white p-1 shadow-lg">
          <div className="flex flex-col">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelectOption(option)}
                className="w-full rounded-lg px-4 py-2 text-right text-sm font-medium text-gray-700 transition hover:bg-amber-50 hover:text-amber-900"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 text-right shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  שינוי סטטוס להזמנה
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  בחרת בסטטוס:{" "}
                  <span className="font-semibold">{selectedOption.label}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-600"
                aria-label="סגור"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              האם אתה בטוח שברצונך לשנות את הסטטוס?
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                disabled={isUpdating}
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!isConfirmEnabled}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? "מעדכן..." : "אישור שינוי סטטוס"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
