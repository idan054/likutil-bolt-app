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
    categories?: Array<{
      id?: number;
      name: string;
      slug?: string;
    }>;
  };
  // meta_data?: Array<
  // {
  //   id: number;
  //   key: string;
  //   value: any;
  // }>;

  meta_data?: Array<any>;
  
}

export interface CompanyPrintDocuments {
  type: string;
  quote_id: number;
  company: string;
  delivery_note: {
    exists: boolean;
    number: number | string | null;
    print_url: string;
  };
  invoices: Array<{
    number: number | string;
    print_url: string;
  }>;
  popup: {
    title: string;
    lines: string[];
  };
}

/**
 * The site's routing decision for an order (spider3d-carrier-route.php, field `s3_carrier`).
 * An empty `use` means the site made no decision and the picker chooses as before.
 */
export interface SiteCarrierDecision {
  v?: number;
  /** 'zipgo' | 'mahirli' | 'negev' | '' */
  use?: string;
  fallback?: string;
  service?: string;
  upgrade?: boolean;
  packages?: number;
  /** A short Hebrew line for the picker. */
  line?: string;
  why?: string;
}

export interface OrderSummary {
  customer_id: number | null;
  is_vip_member?: boolean;
  id: number;
  order_number: number;
  status: string;
  shipment_created_status?: string;
  total: string;
  line_items: LineItem[];
  billing: {
    first_name: string;
    last_name: string;
    city: string;
  };
  date_created: string;
  date_modified?: string;
  date_completed?: string;
  shipping_lines: Array<{
    method_id?: string;
    method_title: string;
    instance_id?: string | number;
    total?: string;
  }>;
  payment_method?: string;
  payment_method_title?: string;
  s3_print?: CompanyPrintDocuments | null;
  s3_label_url?: string | null;
  s3_carrier?: SiteCarrierDecision | null;
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
    instance_id?: string | number;
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
