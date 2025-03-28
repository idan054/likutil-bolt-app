import React from 'react';
import { ChevronDown } from 'lucide-react';
import { translateOrderStatus } from '../../utils/order';
import type { OrderStatus } from '../../types/order';

interface StatusFilterProps {
  statuses: OrderStatus[];
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  statuses,
  selectedStatus,
  onStatusChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative inline-block w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-sm bg-white border rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
      >
        <span>{selectedStatus ? translateOrderStatus(selectedStatus) : 'כל הסטטוסים'}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => {
                onStatusChange(null);
                setIsOpen(false);
              }}
              className={`block w-full text-right px-4 py-2 text-sm hover:bg-gray-100 ${!selectedStatus ? 'bg-gray-50' : ''}`}
              role="menuitem"
            >
              כל הסטטוסים
            </button>
            {statuses.map((status) => (
              <button
                key={status.slug}
                onClick={() => {
                  onStatusChange(status.slug);
                  setIsOpen(false);
                }}
                className={`block w-full text-right px-4 py-2 text-sm hover:bg-gray-100 ${selectedStatus === status.slug ? 'bg-gray-50' : ''}`}
                role="menuitem"
              >
                {status.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};