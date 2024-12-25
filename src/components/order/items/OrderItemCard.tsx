import React from 'react';
import { ProductImage } from './ProductImage';
import { ProductDetails } from './ProductDetails';
import { useSettings } from '../../../hooks/useSettings';
import { getProductUrl } from '../../../utils/product';
import type { LineItem } from '../../../types/order';

interface OrderItemCardProps {
  item: LineItem;
}

export const OrderItemCard: React.FC<OrderItemCardProps> = ({ item }) => {
  const { settings } = useSettings();
  const productUrl = getProductUrl(settings?.storeUrl, item.product_data?.permalink);

  return (
    <a 
      href={productUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex justify-between items-center border-b pb-3 p-2 rounded-lg transition-colors hover:bg-blue-50 group"
    >
      <div className="flex items-center gap-4 flex-1">
        <ProductImage src={item.image?.src} alt={item.name} />
        <ProductDetails 
          name={item.name}
          sku={item.sku}
          quantity={item.quantity}
          stockQuantity={item.product_data?.stock_quantity}
        />
      </div>
      <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
        ₪{item.total}
      </span>
    </a>
  );
};