import React from 'react';
import { MapPin, Package } from 'lucide-react';
import { translations } from '../../../config/translations';
import { LineItem } from '../../../types/order';
import type { PickingLocation } from '../../../utils/pickingRoute';

interface ProductDetailsProps {
  item: LineItem;
  name: string;
  sku: string;
  quantity: number;
  stockQuantity?: number;
  pickingLocation?: PickingLocation;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  item,
  name,
  sku,
  quantity,
  stockQuantity,
  pickingLocation
}) => (
  <div className="flex-1 min-w-0">

    
    <div className="flex items-center gap-2">
      <h4 className="text-lg font-medium [overflow-wrap:anywhere] group-hover:text-blue-600 transition-colors">{name}</h4>
    </div>

    {pickingLocation && (
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm [overflow-wrap:anywhere]">
        <span className="inline-flex items-center gap-1 font-semibold text-blue-900">
          <MapPin size={14} aria-hidden="true" />
          <span>{translations.picking.primaryShelf} <bdi dir="ltr">{pickingLocation.primary}</bdi></span>
        </span>
        {pickingLocation.alternatives.length > 0 && (
          <span className="text-gray-700">
            {translations.picking.otherShelves} <bdi dir="ltr">{pickingLocation.alternatives.join(', ')}</bdi>
          </span>
        )}
        {pickingLocation.overflow.length > 0 && (
          <span className="text-amber-900">
            {translations.picking.overflow} <bdi dir="ltr">{pickingLocation.overflow.join(', ')}</bdi>
          </span>
        )}
      </div>
    )}

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
