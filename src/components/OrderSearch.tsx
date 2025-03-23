import React from 'react';
import { OrderSearchInput } from './search/OrderSearchInput';
import { useOrderSearch } from '../hooks/orders/useOrderSearch';
import { OrderDetails } from '../types/order';
import { useAppState } from '../hooks/useAppState';

interface OrderSearchProps {
  onSearch: (orderId: OrderDetails) => void;
}

export const OrderSearch: React.FC<OrderSearchProps> = ({ onSearch }) => {
  const { searchOrder, isLoading } = useOrderSearch();

    const handleSearch = async (orderId: string) => {
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
    </div>
  );
};



