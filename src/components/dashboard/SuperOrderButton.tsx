import React from 'react';
import { Package } from 'lucide-react';
import { useSuperOrder } from '../../hooks/useSuperOrder';
import type { OrderSummary } from '../../types/order';

interface SuperOrderButtonProps {
  orders: OrderSummary[];
  onGenerate: (orders: OrderSummary[]) => void;
}

export const SuperOrderButton: React.FC<SuperOrderButtonProps> = ({ 
  orders,
  onGenerate
}) => {
  const { isLoading } = useSuperOrder();

  return (
    <button
      onClick={() => onGenerate(orders)}
      disabled={isLoading || orders.length === 0}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mb-4"
    >
      <Package size={20} />
      <span>ליקוט מרוכז ({orders.length} הזמנות)</span>
    </button>
  );
};