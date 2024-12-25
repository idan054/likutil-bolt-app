import React from 'react';
import { Printer } from 'lucide-react';

interface SuperOrderFooterProps {
  selectedCount: number;
  totalCount: number;
  onClose: () => void;
  onPrint: () => void;
}

export const SuperOrderFooter: React.FC<SuperOrderFooterProps> = ({
  selectedCount,
  totalCount,
  onClose,
  onPrint,
}) => (
  <div className="p-6 border-t bg-gray-50 rounded-b-lg flex-shrink-0">
    <div className="flex justify-between items-center">
      <div className="text-sm text-gray-600">
        {selectedCount} מתוך {totalCount} פריטים נאספו
      </div>
      <div className="flex gap-4">
        <button
          onClick={onPrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Printer size={20} />
          <span>הדפסה</span>
        </button>
        <button
          onClick={onClose}
          disabled={selectedCount !== totalCount}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>סיום</span>
        </button>
      </div>
    </div>
  </div>
);