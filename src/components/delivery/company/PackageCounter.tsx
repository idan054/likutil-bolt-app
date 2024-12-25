import React, { useState } from 'react';
import { Package, Plus, Minus } from 'lucide-react';

interface PackageCounterProps {
  isCreating: boolean;
  onCountChange: (count: number) => void;
}

export const PackageCounter: React.FC<PackageCounterProps> = ({ isCreating, onCountChange }) => {
  const [count, setCount] = useState(1);

  const handleChange = (newCount: number) => {
    setCount(newCount);
    onCountChange(newCount);
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-blue-700">
          <Package size={20} />
          <span className="font-medium">מספר חבילות למשלוח:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleChange(Math.max(1, count - 1))}
            disabled={count <= 1 || isCreating}
            className="p-2 rounded-lg bg-white hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200"
            title="הפחת חבילה"
          >
            <Minus size={18} />
          </button>
          <span className="w-12 text-center font-bold text-lg text-blue-700">{count}</span>
          <button
            onClick={() => handleChange(Math.min(99, count + 1))}
            disabled={count >= 99 || isCreating}
            className="p-2 rounded-lg bg-white hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200"
            title="הוסף חבילה"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};