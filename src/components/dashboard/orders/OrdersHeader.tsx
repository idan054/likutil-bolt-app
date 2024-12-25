import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface OrdersHeaderProps {
  count: number;
  icon: LucideIcon;
}

export const OrdersHeader: React.FC<OrdersHeaderProps> = ({ count, icon: Icon }) => (
  <div className="flex items-center gap-4">
    <div className="bg-blue-100 p-3 rounded-full">
      <Icon size={32} className="text-blue-600" />
    </div>
    <div>
      <h3 className="text-xl font-bold text-blue-900">הזמנות בהמתנה</h3>
      <p className="text-blue-700 text-lg">{count} הזמנות לטיפול</p>
    </div>
  </div>
);