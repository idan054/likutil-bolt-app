import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 text-sm bg-white border rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between transition-colors duration-200"
        whileTap={{ scale: 0.98 }}
      >
        <span className="font-medium">
          {selectedStatus ? translateOrderStatus(selectedStatus) : 'כל הסטטוסים'}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden"
          >
            <div className="py-1" role="menu" aria-orientation="vertical">
              <motion.button
                onClick={() => {
                  onStatusChange(null);
                  setIsOpen(false);
                }}
                className={`block w-full text-right px-4 py-2.5 text-sm transition-colors duration-150
                  ${!selectedStatus ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}
                role="menuitem"
                whileHover={{ backgroundColor: !selectedStatus ? 'rgb(239 246 255)' : 'rgb(249 250 251)' }}
                whileTap={{ scale: 0.98 }}
              >
                כל הסטטוסים
              </motion.button>
              {statuses.map((status) => (
                <motion.button
                  key={status.slug}
                  onClick={() => {
                    onStatusChange(status.slug);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-right px-4 py-2.5 text-sm transition-colors duration-150
                    ${selectedStatus === status.slug ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}
                  role="menuitem"
                  whileHover={{ backgroundColor: selectedStatus === status.slug ? 'rgb(239 246 255)' : 'rgb(249 250 251)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {status.name}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};