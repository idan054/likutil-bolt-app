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
      className="w-[480px]" // Changed from w-full max-w-xl to specific width
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
          className="w-full px-6 py-3 pl-12 text-lg text-gray-700 bg-white border rounded-lg focus:border-blue-500 focus:outline-none text-right"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !orderId.trim()}
          className="absolute left-3 p-2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>
    </motion.form>
  );
};