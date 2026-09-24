import React from 'react';
import { toast } from 'react-hot-toast';
import { Printer, Loader2, CheckCircle, Rocket } from 'lucide-react';
import type { DeliveryTaskResponse } from '../../../services/delivery/types';
import { getPrintLabelSource } from '../../../services/delivery/validation/response';
import type { OrderDetails } from '../../../types/order';
import { OrderStatusOverrideMenu } from '../../order/OrderStatusOverrideMenu';
import { getReprintLabelUrl, getShipmentLabelUrl } from '../../../utils/shippingLabel';
import { getDeliveryCity } from '../../../services/delivery/mappers';

interface ActionButtonsProps {
  order: OrderDetails;
  provider: string;
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
  provider,
  deliveryResponse,
  isCreating,
  isCompleting,
  onCreateDelivery,
  onComplete,
  packNum,  
  deliveryType,  
  onStatusChanged,
}) => {
  const sentCity = getDeliveryCity(order);
  const reprintUrl = getReprintLabelUrl(order.s3_label_url, order.id, provider, sentCity);
  const signedPrintUrl = deliveryResponse
    ? getShipmentLabelUrl(order.s3_label_url, order.id, provider, deliveryResponse, packNum, sentCity)
    : null;
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
        <div className="flex flex-1 flex-col gap-2">
          <button
            onClick={() => onCreateDelivery(packNum, deliveryType)}
            disabled={isCreating}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? <Loader2 className="animate-spin" size={20} /> : <Rocket size={20} />}
            <span>שגר משלוח בטיל!</span>
          </button>
          {reprintUrl && !isCreating && (
            <a
              href={reprintUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-sm font-semibold text-blue-700 underline underline-offset-2"
            >
              כבר הוקם משלוח? הדפס מדבקה שוב
            </a>
          )}
        </div>
      ) : (
        <>
          {reprintUrl ? (
            <a
              href={signedPrintUrl ?? reprintUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Printer size={20} />
              <span>הדפסת מדבקה</span>
            </a>
          ) : (
            <button
              onClick={() => handlePrintLabel(deliveryResponse.print_label)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Printer size={20} />
              <span>הדפסת מדבקה</span>
            </button>
          )}
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
