// Update LineItem interface to include product_data
export interface LineItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: string;
  product_id: number;
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
}

export interface OrderSummary {
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