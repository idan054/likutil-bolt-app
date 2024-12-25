import React from 'react';

interface QuantityBadgeProps {
  quantity: number;
}

export const QuantityBadge: React.FC<QuantityBadgeProps> = ({ quantity }) => {
  if (quantity <= 1) return null;

  return (
    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
      x{quantity} כמות גבוהה
    </span>
  );
};