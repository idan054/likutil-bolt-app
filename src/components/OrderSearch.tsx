import React from 'react';
import { OrderSearchInput } from './search/OrderSearchInput';
import { useOrderSearch } from '../hooks/orders/useOrderSearch';
import { OrderDetails } from './OrderDetails';

export const OrderSearch: React.FC = () => {
  const { searchOrder, isLoading, order, clearOrder } = useOrderSearch();

  return (
    <div className="flex flex-col items-center gap-8">
      <OrderSearchInput 
        onSearch={searchOrder}
        isLoading={isLoading}
      />
      
      {order && (
        <OrderDetails 
          order={order}
          onReset={clearOrder}
          onComplete={clearOrder}
        />
      )}
    </div>
  );
};