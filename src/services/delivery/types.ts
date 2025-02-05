// Add new type for delivery request params
export interface DeliveryRequestParams {
  provider: string;
  key: string;
}

// Update existing types
export interface DeliveryTaskRequest {
  id: string;
  number: string;
  date_created: string;
  customer_note: string;
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
  };
  billing: {
    phone: string;
    email: string;
  };
}

export interface DeliveryTaskResponse {
  task_id: number;
  public_id: string;
  original_order_id: string;
  destination_region_str: string;
  label: string;
  barcode: string;
  tracking_link: string;
}