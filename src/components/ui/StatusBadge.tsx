import React, { useState } from 'react';
import { translateOrderStatus } from '../../utils/order';
import { useSettings } from '../../hooks/useSettings';
import { updateOrderStatus } from '../../services/orders/orders.service';
import { toast } from 'react-hot-toast';
import { ChevronDown } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  orderId: string;
  onStatusUpdate?: (newStatus: string) => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status: initialStatus, orderId, onStatusUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const { orderStatuses } = useSettings();

  const getStatusStyles = (statusValue: string) => {
    switch (statusValue) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    setCurrentStatus(newStatus); // Optimistic update
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('הסטטוס עודכן בהצלחה!');
      onStatusUpdate?.(newStatus);
      setIsOpen(false);
    } catch (error) {
      setCurrentStatus(initialStatus); // Revert on error
      toast.error('Failed to update status');
      console.error('[StatusBadge] Status update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(currentStatus)} flex items-center gap-1 cursor-pointer hover:opacity-90 transition-opacity ${isUpdating ? 'opacity-75' : ''}`}
        disabled={isUpdating}
      >
        {translateOrderStatus(currentStatus)}
        {isUpdating ? (
          <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {orderStatuses.map((statusOption) => (
              <button
                key={statusOption.slug}
                onClick={() => handleStatusChange(statusOption.slug)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${status === statusOption.slug ? 'bg-gray-50' : ''}`}
                role="menuitem"
              >
                {statusOption.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};