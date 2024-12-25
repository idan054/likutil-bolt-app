import React from 'react';
import { QuantityBadge } from '../../ui/QuantityBadge';
import { Package } from 'lucide-react';

interface ProductDetailsProps {
  name: string;
  sku: string;
  quantity: number;
  stockQuantity?: number;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  name,
  sku,
  quantity,
  stockQuantity
}) => (
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <h4 className="text-lg font-medium truncate group-hover:text-blue-600 transition-colors">{name}</h4>
      <QuantityBadge quantity={quantity} />
    </div>
    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
      <span>כמות: {quantity}</span>
      <span>מק״ט: {sku || 'N/A'}</span>

      
      {typeof stockQuantity === 'number' && (
        <span className="flex items-center gap-1">
          <Package size={14} />
          <span>מלאי: {stockQuantity}</span>
        </span>
      )}
    </div>
  </div>
);