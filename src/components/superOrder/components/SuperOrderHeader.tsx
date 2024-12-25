import React from 'react';
import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SuperOrderHeaderProps {
  onClose: () => void;
  icon: LucideIcon;
}

export const SuperOrderHeader: React.FC<SuperOrderHeaderProps> = ({ onClose, icon: Icon }) => (
  <div className="p-6 border-b flex-shrink-0">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Icon className="text-blue-600" size={24} />
        <h3 className="text-xl font-semibold">רשימת ליקוט מרוכזת</h3>
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
);