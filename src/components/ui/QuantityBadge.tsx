import React from 'react';

interface QuantityBadgeProps {
  quantity: number;
}

export const QuantityBadge: React.FC<QuantityBadgeProps> = ({ quantity }) => {
  if (quantity < 1) return null;

  const bgColorClass = quantity === 1 
    ? "text-sm bg-gray-100 text-gray-800" 
    : `text-base bg-yellow-100 text-yellow-800 font-bold`;
  
  return (
    <span className={`px-3 py-1 ${bgColorClass} font-medium rounded-[10px]  flex flex-col items-center my-1 -mx-1`}>
      <span>x{quantity}</span>
      {/* {quantity > 1 && <span>פריטים</span>} */}
    </span>
  );
};