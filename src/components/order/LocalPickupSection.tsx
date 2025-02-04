import React from 'react';
import { CheckCircle, Loader2, Printer, Truck } from 'lucide-react';

interface LocalPickupSectionProps {
  isCompleting: boolean;
  onComplete: () => Promise<void>;
  onSendAnyway: () => void;
}

export const LocalPickupSection: React.FC<LocalPickupSectionProps> = ({
  isCompleting,
  onComplete,
  onSendAnyway,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">
          איסוף עצמי
        </h3>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onComplete}
            disabled={isCompleting}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompleting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <CheckCircle size={20} />
            )}
            <span>סיום</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
          >
            <Printer size={20} />
            <span>הדפסת מדבקה</span>
          </button>
        </div>
        <button
          onClick={onSendAnyway}
          className="flex items-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors w-full justify-center"
        >
          <Truck size={20} />
          <span>שלח בכל זאת</span>
        </button>
      </div>
    </div>
  );
};