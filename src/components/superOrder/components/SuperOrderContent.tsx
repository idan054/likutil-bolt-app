import React from 'react';
import { SuperOrderItem } from '../SuperOrderItem';
import type { SuperOrderItem as SuperOrderItemType } from '../../../types/superOrder';

interface SuperOrderContentProps {
  items: SuperOrderItemType[];
  selectedItems: Set<string>;
  onToggleItem: (id: string) => void;
}

export const SuperOrderContent: React.FC<SuperOrderContentProps> = ({
  items,
  selectedItems,
  onToggleItem,
}) => (
  <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
    {items.map((item) => (
      <SuperOrderItem
        key={item.id}
        item={item}
        isSelected={selectedItems.has(item.id)}
        onToggle={() => onToggleItem(item.id)}
      />
    ))}
  </div>
);