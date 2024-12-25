import React from 'react';

interface ProductDetailsProps {
  name: string;
  sku: string;
  orderIds: number[];
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  name,
  sku,
  orderIds,
}) => (
  <div className="flex-1">
    <h4 className="font-medium text-lg">{name}</h4>
    <div className="text-lg font-semibold text-gray-800 mt-1">
      מק״ט: {sku}
    </div>
    <div className="text-sm text-gray-500 mt-1">
      הזמנות: {orderIds.map(id => `#${id}`).join(', ')}
    </div>
  </div>
);