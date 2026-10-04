// Add new type for delivery request params
export interface DeliveryRequestParams {
  userId: string;
  provider: string;
  keys: string;
  additionalShipmentRevision?: string;
  replacementShipmentRevision?: string;
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
  package_count?: string;
  cancelled?: boolean;
  can_cancel?: boolean;
  delivered?: boolean;
  status_checked?: boolean;
  error_text?: string;

  // Mahir Li (Lionwheel) task fields returned by the create-delivery API.
  // Not always typed by the proxy, kept optional so we can persist whatever is present.
  id?: string | number;
  public_id?: string;
  barcode?: string;
  destination_region_str?: string;
  task_id?: string | number;
  DeliveryNumber?: string | number;
}

export interface ShipmentState {
  revision?: string;
  can_additional?: boolean;
  can_replace?: boolean;
  shipments?: DeliveryTaskResponse[];
  state: 'none' | 'creating' | 'uncertain' | 'created' | 'rejected' | 'cancelling';
  blocked: boolean;
  message: string;
  response: DeliveryTaskResponse | null;
}
