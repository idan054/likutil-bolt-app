import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type SortOption = 'quantity' | 'sku';

interface SuperOrderHeaderProps {
  onClose: () => void;
  icon: LucideIcon;
  sortBy: SortOption;
  onSortChange: (option: SortOption) => void;
}

export const SuperOrderHeader: React.FC<SuperOrderHeaderProps> = ({ onClose, icon: Icon, sortBy, onSortChange }) => (
  <div className="p-6 border-b flex-shrink-0">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Icon className="text-blue-600" size={24} />
        <h3 className="text-xl font-semibold">רשימת ליקוט מרוכזת</h3>
      </div>




        <div className="flex justify-between items-center">


        <div id='filter' className="relative inline-block mx-4" dir="rtl">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none bg-white border border-gray-300 rounded-md py-2 px-4 pl-8
              text-sm font-medium text-gray-700
              hover:border-blue-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-colors duration-200 ease-in-out
              shadow-sm
              text-right"
            dir="rtl"
          >
            <option value="quantity" className="py-1 text-right">כמות</option>
            <option value="sku" className="py-1 text-right">מק"ט</option>
          </select>
          <ChevronDown className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        </div>
        
        <button 
        onClick={onClose} 
        className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
        aria-label="סגור"
      >
        <X size={24} />
      </button>
        </div>


      
    </div>
  </div>
);