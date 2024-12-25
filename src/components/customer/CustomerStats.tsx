import React from 'react';
import { History, CreditCard, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface CustomerStatsProps {
  ordersCount: number;
  totalSpent: string;
  isPayingCustomer: boolean;
}

export const CustomerStats: React.FC<CustomerStatsProps> = ({
  ordersCount,
  totalSpent,
  isPayingCustomer,
}) => (
  <div className="bg-blue-50 rounded-lg p-4 mt-4">
    <div className="grid grid-cols-3 gap-4">
      <div className="flex items-center gap-2">
        <History className="text-blue-600" size={20} />
        <div>
          <div className="text-sm text-gray-600">הזמנות קודמות</div>
          <div className="font-semibold">{ordersCount}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <CreditCard className="text-blue-600" size={20} />
        <div>
          <div className="text-sm text-gray-600">סה״כ קניות</div>
          <div className="font-semibold">{formatCurrency(totalSpent)}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Package className="text-blue-600" size={20} />
        <div>
          <div className="text-sm text-gray-600">סטטוס</div>
          <div className="font-semibold">
            {isPayingCustomer ? 'לקוח קבוע' : 'לקוח חדש'}
          </div>
        </div>
      </div>
    </div>
  </div>
);