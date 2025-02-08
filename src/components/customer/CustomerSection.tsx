import React from "react";
import { CustomerDetails } from "./CustomerDetails";
import { ShippingAddress } from "./ShippingAddress";
import type { OrderDetails } from "../../types/order";

interface CustomerSectionProps {
  billing: OrderDetails["billing"];
  shipping: OrderDetails["shipping"];
}

export const CustomerSection: React.FC<CustomerSectionProps> = ({
  billing,
  shipping,
}) => (
  <div className="mt-8 pt-6 border-t">
    <div className="grid md:grid-cols-2 gap-6">
      <CustomerDetails billing={billing} />
      <ShippingAddress shipping={shipping} />
    </div>
  </div>
);
