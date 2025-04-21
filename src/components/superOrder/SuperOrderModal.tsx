import React, { useState, useMemo } from 'react';
import { X, Printer, Rows3 } from 'lucide-react';
import { SuperOrderHeader } from './components/SuperOrderHeader';
import { SuperOrderContent } from './components/SuperOrderContent';
import { SuperOrderFooter } from './components/SuperOrderFooter';
import { SuperOrderProgress } from './components/SuperOrderProgress';
import { SuperOrderPDF } from './components/SuperOrderPDF';
import type { SuperOrderItem as SuperOrderItemType } from '../../types/superOrder';

type SortOption = 'quantity' | 'sku';

interface SuperOrderModalProps {
  items: SuperOrderItemType[];
  onClose: () => void;
}

export const SuperOrderModal: React.FC<SuperOrderModalProps> = ({ items, onClose }) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('quantity');

  const progress = useMemo(() => {
    return (selectedItems.size / items.length) * 100;
  }, [selectedItems.size, items.length]);

  const handleToggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortBy === 'quantity') {
        return b.quantity - a.quantity;
      }
      return a.sku.localeCompare(b.sku);
    });
  }, [items, sortBy]);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl mx-auto max-h-[85vh] flex flex-col" dir="rtl">
          <SuperOrderHeader onClose={onClose} icon={Rows3} sortBy={sortBy} onSortChange={setSortBy} />
          <SuperOrderProgress progress={progress} />
          <SuperOrderContent
            items={sortedItems}
            selectedItems={selectedItems}
            onToggleItem={handleToggleItem}
          />
          <SuperOrderFooter
            selectedCount={selectedItems.size}
            totalCount={items.length}
            onClose={onClose}
            onPrint={handlePrint}
          />
        </div>
      </div>
      <SuperOrderPDF items={sortedItems} selectedItems={selectedItems} />
    </>
  );
};