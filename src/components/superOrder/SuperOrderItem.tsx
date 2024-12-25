import React from 'react';
import { Check } from 'lucide-react';
import { ProductImage } from './components/ProductImage';
import { ProductDetails } from './components/ProductDetails';
import type { SuperOrderItem as SuperOrderItemType } from '../../types/superOrder';

interface SuperOrderItemProps {
  item: SuperOrderItemType;
  isSelected: boolean;
  onToggle: () => void;
}

export const SuperOrderItem: React.FC<SuperOrderItemProps> = ({
  item,
  isSelected,
  onToggle,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // Prevent toggling when clicking the checkbox directly
    if (!(e.target instanceof HTMLButtonElement)) {
      onToggle();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
          isSelected 
            ? 'bg-blue-600 border-blue-600 text-white' 
            : 'border-gray-300 hover:border-blue-400'
        }`}
        aria-label={isSelected ? 'הסר מהרשימה' : 'הוסף לרשימה'}
      >
        {isSelected && <Check size={16} />}
      </button>

      <ProductImage src={item.image} alt={item.name} />
      <ProductDetails
        name={item.name}
        sku={item.sku}
        orderIds={item.orderIds}
      />

      {/* Quantity */}
      <div className="text-xl font-bold">
        {item.quantity} יח׳
      </div>
    </div>
  );
};