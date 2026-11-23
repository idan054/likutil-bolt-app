import React from 'react';
import { Package } from 'lucide-react';
import { LineItem } from '../../../types/order';

interface ProductDetailsProps {
  item: LineItem;
  name: string;
  sku: string;
  quantity: number;
  stockQuantity?: number;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  item,
  name,
  sku,
  quantity,
  stockQuantity
}) => (
  <div className="flex-1 min-w-0">

    
    <div className="flex items-center gap-2">
      <h4 className="text-lg font-medium [overflow-wrap:anywhere] group-hover:text-blue-600 transition-colors">{name}</h4>
    </div>


    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 [overflow-wrap:anywhere]">
      {/* <span>כמות: {quantity}</span> */}
      {sku && <span>מק״ט: {sku || 'N/A'}</span>}

      
      {typeof stockQuantity === 'number' && (
        <span className="flex items-center gap-1">
          <Package size={14} />
          <span>מלאי: {stockQuantity}</span>
        </span>
      )}



      
    </div>
  </div>
);