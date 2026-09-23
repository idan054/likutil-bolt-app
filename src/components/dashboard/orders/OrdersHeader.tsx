import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { translateOrderStatus } from '../../../utils/order';

interface OrdersHeaderProps {
  count: number;
  icon: LucideIcon;
  selectedStatus: string | null;
  total: number | null;
  isLoading?: boolean;
}

export const OrdersHeader: React.FC<OrdersHeaderProps> = ({ count, total, isLoading, icon: Icon, selectedStatus }) => {
  const statusLabel = selectedStatus
    ? `במצב ${translateOrderStatus(selectedStatus)}`
    : 'בכל הסטטוסים';
  const countLabel = isLoading
    ? 'מעדכן הזמנות...'
    : total !== null && total > count
      ? `${count} מתוך ${total} הזמנות ${statusLabel}`
      : total === null && count >= 15
        ? `${count} הזמנות מוצגות ${statusLabel}; הסך הכולל אינו זמין`
        : `${count} הזמנות ${statusLabel}`;

  return (
    <div className="flex items-center gap-4">
      <div className="bg-blue-100 p-3 rounded-full">
        <Icon size={32} className="text-blue-600" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-blue-900">הזמנות אחרונות</h3>
        <p className="text-blue-700 text-lg">{countLabel}</p>
      </div>
    </div>
  );
};
