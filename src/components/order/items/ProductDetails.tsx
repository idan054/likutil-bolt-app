import React from 'react';
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
      <h4 className="text-lg font-medium line-clamp-3 truncate group-hover:text-blue-600 transition-colors">{name}</h4>
    </div>


    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
      {/* <span>כמות: {quantity}</span> */}
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