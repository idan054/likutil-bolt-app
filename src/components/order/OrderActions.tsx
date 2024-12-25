import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { translations } from '../../config/translations';
import type { DeliveryProvider } from '../delivery/DeliverySelector';

interface OrderActionsProps {
  onOpenOrder: () => void;
  onComplete: () => Promise<void>;
  deliveryProvider: DeliveryProvider | null;
  isCreating: boolean;
  isCompleting: boolean;
  orderOpened: boolean;
}

export const OrderActions: React.FC<OrderActionsProps> = ({
  onOpenOrder,
  onComplete,
  deliveryProvider,
  isCreating,
  isCompleting,
  orderOpened,
}) => {
  return (
    <div className="flex justify-end gap-4">
      <button
        onClick={onOpenOrder}
        disabled={!deliveryProvider || isCreating || orderOpened}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isCreating && <Loader2 className="animate-spin" size={18} />}
        {translations.actions.openOrder}
      </button>
      <button
        onClick={onComplete}
        disabled={!deliveryProvider || isCompleting || !orderOpened}
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isCompleting ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <CheckCircle size={18} />
        )}
        {translations.actions.complete}
      </button>
    </div>
  );
};