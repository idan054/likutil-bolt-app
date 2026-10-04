import React from 'react';
import { Printer, Loader2, CheckCircle, Rocket } from 'lucide-react';
import type { DeliveryTaskResponse } from '../../../services/delivery/types';
import { openPrintLabel } from '../../../utils/openPrintLabel';
import type { OrderDetails } from '../../../types/order';
import { OrderStatusOverrideMenu } from '../../order/OrderStatusOverrideMenu';
import { getReprintLabelUrl, getShipmentLabelUrl } from '../../../utils/shippingLabel';
import { getDeliveryCity } from '../../../services/delivery/mappers';

interface ActionButtonsProps {
  order: OrderDetails;
  provider: string;
  deliveryResponse: DeliveryTaskResponse | null;
  isCreating: boolean;
  isCreationBlocked?: boolean;
  replacementLabel?: string;
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
  isCreationBlocked,
  replacementLabel,
  isCompleting,
  onCreateDelivery,
  onComplete,
  packNum,  
  deliveryType,  
  onStatusChanged,
}) => {
  const sentCity = getDeliveryCity(order);
  const labelProvider = deliveryResponse?.provider || provider;
  const reprintUrl = getReprintLabelUrl(order.s3_label_url, order.id, labelProvider, sentCity);
  const signedPrintUrl = deliveryResponse
    ? getShipmentLabelUrl(order.s3_label_url, order.id, labelProvider, deliveryResponse, packNum, sentCity, true)
    : null;


  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
      {!deliveryResponse ? (
        <div className="flex flex-1 flex-col gap-2">
          <button
            onClick={() => onCreateDelivery(packNum, deliveryType)}
            disabled={isCreating || isCreationBlocked}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? <Loader2 className="animate-spin" size={20} /> : <Rocket size={20} />}
            <span>{isCreating && replacementLabel ? 'מאמת ביטול ומפיק משלוח…' : replacementLabel || 'שגר משלוח בטיל!'}</span>
          </button>
          {reprintUrl && !isCreating && !replacementLabel && (
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
              onClick={() => openPrintLabel(deliveryResponse.print_label)}
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
