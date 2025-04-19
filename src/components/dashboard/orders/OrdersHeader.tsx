import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { translateOrderStatus } from '../../../utils/order';

interface OrdersHeaderProps {
  count: number;
  icon: LucideIcon;
  selectedStatus: string | null;
}

export const OrdersHeader: React.FC<OrdersHeaderProps> = ({ count, icon: Icon, selectedStatus }) => {
  const translatedStatus = translateOrderStatus(selectedStatus ??'');

  return (
    <div className="flex items-center gap-4">
      <div className="bg-blue-100 p-3 rounded-full">
        <Icon size={32} className="text-blue-600" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-blue-900">הזמנות אחרונות</h3>
        <p className="text-blue-700 text-lg">{count} הזמנות במצב {translatedStatus}</p>
      </div>
    </div>
  );
};
