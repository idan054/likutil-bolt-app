import React from 'react';
import { toast } from 'react-hot-toast';
import { Printer, Loader2, CheckCircle, Rocket } from 'lucide-react';
import type { DeliveryTaskResponse } from '../../../services/delivery/types';
import { getPrintLabelSource } from '../../../services/delivery/validation/response';
import type { OrderDetails } from '../../../types/order';
import { OrderStatusOverrideMenu } from '../../order/OrderStatusOverrideMenu';

interface ActionButtonsProps {
  order: OrderDetails;
  deliveryResponse: DeliveryTaskResponse | null;
  isCreating: boolean;
  isCompleting: boolean;
  onCreateDelivery: (packNum: string, deliveryType: string) => void;
  onComplete: () => Promise<void>;
  packNum: string;
  deliveryType: string;
  onStatusChanged: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  order,
  deliveryResponse,
  isCreating,
  isCompleting,
  onCreateDelivery,
  onComplete,
  packNum,  
  deliveryType,  
  onStatusChanged,
}) => {
  const handlePrintLabel = (printLabel: string) => {
    const source = getPrintLabelSource(printLabel);

    if (!source) {
      toast.error('לא התקבלה מדבקת PDF תקינה מחברת המשלוחים');
      return;
    }

    if (source.type === 'url') {
      window.open(source.value, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const binary = atob(source.value);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      // Allow the new tab enough time to finish reading the blob before releasing it.
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('לא ניתן לפתוח את מדבקת ה-PDF שהתקבלה');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
      {!deliveryResponse ? (
        <button
          onClick={() => onCreateDelivery(packNum, deliveryType)}
          disabled={isCreating}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            // <Package size={20} />
            <Rocket size={20} />
          )}
          {/* <span>פתח הזמנה</span> */}
          <span>שגר משלוח בטיל!</span>
        </button>
      ) : (
        <>
          <button
            onClick={() => handlePrintLabel(deliveryResponse.print_label)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Printer size={20} />
            <span>הדפסת מדבקה</span>
          </button>
          <div className="flex flex-1 items-center gap-2">
            <button
              onClick={onComplete}
              disabled={isCompleting}
              className="flex flex-1 items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isCompleting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <CheckCircle size={20} />
              )}
              <span>סיום</span>
            </button>
            <OrderStatusOverrideMenu
              order={order}
              isDisabled={isCompleting}
              onStatusChanged={onStatusChanged}
            />
          </div>
        </>
      )}
    </div>
  );
};
