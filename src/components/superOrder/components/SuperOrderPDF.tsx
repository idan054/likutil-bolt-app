import React from 'react';
import type { SuperOrderItem as SuperOrderItemType } from '../../../types/superOrder';

interface SuperOrderPDFProps {
  items: SuperOrderItemType[];
  selectedItems: Set<string>;
}

export const SuperOrderPDF: React.FC<SuperOrderPDFProps> = ({ items, selectedItems }) => {
  const filteredItems = items.filter(item => selectedItems.has(item.id));

  return (
    <div className="print:block hidden">
      <div className="w-[210mm] min-h-[297mm] mx-auto bg-white p-8" dir="rtl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">רשימת ליקוט מרוכזת</h1>
          <p className="text-gray-600">{new Date().toLocaleDateString('he-IL')}</p>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 break-inside-avoid">
              <div className="flex items-start gap-4">
                {/* Image */}
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  <p className="text-gray-600 mb-1">מק"ט: {item.sku}</p>
                  <p className="text-xl font-bold text-blue-600">{item.quantity} יח׳</p>
                  <div className="mt-2 text-sm text-gray-500">
                    הזמנות: {item.orderIds.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>סה"כ פריטים: {filteredItems.length}</p>
        </div>
      </div>
    </div>
  );
};