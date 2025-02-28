// Update LineItem interface to include product_data
export interface LineItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: string;
  product_id: number;
  variation_id?: number;
  tax_class?: string;
  subtotal?: string;
  subtotal_tax?: string;
  total_tax?: string;
  image?: {
    src: string;
    alt: string;
  };
  product_data?: {
    id: number;
    name: string;
    permalink: string;
    sku: string;
    price: number;
    stock_quantity?: number;
  };
  // meta_data?: Array<
  // {
  //   id: number;
  //   key: string;
  //   value: any;
  // }>;

  meta_data?: Array<any>;
  
}

export interface OrderSummary {
  customer_id: number | null;
  id: number;
  status: string;
  total: string;
  line_items: LineItem[];
  billing: {
    first_name: string;
    last_name: string;
    city: string;
  };
  date_created: string;
  shipping_lines: Array<{
    method_title: string;
  }>;
}

export interface OrderDetails extends OrderSummary {
  customer_id: number | null;
  customer_note: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone: string;
  };
  shipping_lines: Array<{
    method_id: string;
    method_title: string;
    total: string;
  }>;
  shipping_total: string;
  payment_method: string;
  payment_method_title: string;
}

export interface OrderStatus {
  slug: string;
  name: string;
}