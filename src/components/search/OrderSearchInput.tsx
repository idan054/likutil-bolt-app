import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderSearchInputProps {
  onSearch: (orderId: string) => void;
  isLoading: boolean;
}

export const OrderSearchInput: React.FC<OrderSearchInputProps> = ({ 
  onSearch, 
  isLoading 
}) => {
  const [orderId, setOrderId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      onSearch(orderId.trim());
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="w-full px-4 sm:px-0 sm:w-[480px]"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      dir="rtl"
    >
      <div className="relative flex items-center">
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="הזן מספר הזמנה..."
          className="w-full px-4 sm:px-6 py-2.5 sm:py-3 pl-12 text-base sm:text-lg text-gray-700 bg-white border rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-right transition-shadow"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !orderId.trim()}
          className="absolute left-3 p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-full"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>
    </motion.form>
  );
};