import React from 'react';
import { OrderSearchInput } from './search/OrderSearchInput';
import { useOrderSearch } from '../hooks/orders/useOrderSearch';
import { OrderDetails } from '../types/order';

interface OrderSearchProps {
  onSearch: (orderId: OrderDetails) => void;
  onSearchStart?: () => void;
}

export const OrderSearch: React.FC<OrderSearchProps> = ({ onSearch, onSearchStart }) => {
  const { searchOrder, isLoading, error } = useOrderSearch();

    const handleSearch = async (orderId: string) => {
    onSearchStart?.();
    const result = await searchOrder(orderId);
    if (result) {
      onSearch(result);
    }
  };


  return (
    <div className="flex flex-col items-center gap-8">
      <OrderSearchInput 
        onSearch={handleSearch}
        isLoading={isLoading}
      />
      {error && <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
    </div>
  );
};



