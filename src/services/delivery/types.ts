// Add new type for delivery request params
export interface DeliveryRequestParams {
  userId: string;
  provider: string;
  keys: string;
}

// Update existing types
export interface DeliveryTaskRequest {
  pack_num: string;
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
  business: {
    address: string;
    city: string;
    name: string;
  };
}

export interface DeliveryTaskResponse {

  print_label: string;
  control_panel_link: string;
  provider: string;
  track_number: string;
  error_text?: string;
}
