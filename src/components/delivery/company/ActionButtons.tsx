import React from 'react';
import { Package, Printer, Loader2, CheckCircle } from 'lucide-react';
import type { DeliveryTaskResponse } from '../../../services/delivery/types';

interface ActionButtonsProps {
  deliveryResponse: DeliveryTaskResponse | null;
  isCreating: boolean;
  isCompleting: boolean;
  onCreateDelivery: (packNum: string) => void;
  onComplete: () => Promise<void>;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  deliveryResponse,
  isCreating,
  isCompleting,
  onCreateDelivery,
  onComplete,
}) => (
  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
    {!deliveryResponse ? (
      <button
        onClick={() => onCreateDelivery("1")}
        disabled={isCreating}
        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <Package size={20} />
        )}
        <span>פתח הזמנה</span>
      </button>
    ) : (
      <>
        <a
          href={deliveryResponse.label}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Printer size={20} />
          <span>הדפסת מדבקה</span>
        </a>
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isCompleting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <CheckCircle size={20} />
          )}
          <span>סיום</span>
        </button>
      </>
    )}
  </div>
);