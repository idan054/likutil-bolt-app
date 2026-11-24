import React from 'react';
import { OrderItemCard } from './items/OrderItemCard';
import { translations } from '../../config/translations';
import type { OrderDetails } from '../../types/order';
import { orderItemsForPicking, type PickingRoute } from '../../utils/pickingRoute';

interface OrderItemsProps {
  items: OrderDetails['line_items'];
  pickingRoute?: PickingRoute;
}

export const OrderItems: React.FC<OrderItemsProps> = ({ items, pickingRoute }) => {
  const rows = React.useMemo(() => pickingRoute
    ? orderItemsForPicking(items, pickingRoute)
    : items.map(item => ({ item, location: undefined })), [items, pickingRoute]);
  const firstUnmapped = pickingRoute ? rows.findIndex(row => !row.location) : -1;

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-semibold">{items.length} {translations.orderItems}</h3>
        {rows[0]?.location && (
          <span className="text-sm text-gray-600">{translations.picking.route}</span>
        )}
      </div>
      <div className="space-y-4">
        {rows.map(({ item, location }, index) => (
          <React.Fragment key={item.id}>
            {index === firstUnmapped && (
              <h4 className="border-t border-amber-200 pt-3 text-sm font-semibold text-amber-900">
                {translations.picking.checkLocation}
              </h4>
            )}
            <OrderItemCard item={item} pickingLocation={location} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
