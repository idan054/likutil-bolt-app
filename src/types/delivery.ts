export interface DeliveryField {
  id: string;
  label: string;
  type: 'text' | 'password';
  placeholder: string;
  supportText?: string;
  supportPhone?: string;
}

export interface DeliveryIntegration {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  isConnected: boolean;
  controlPanelLink?: string; // Added controlPanelLink field
  fields: DeliveryField[];
}

export interface DeliveryConnection {
  provider: string;
  key: string;
  lastTested?: string;
  isConnected: boolean;
}

export interface DeliverySettings {
  connections: DeliveryConnection[];
}

export interface DeliveryTestRequest {
  pack_num: string;
  id: string;
  number: string;
  date_created: string;
  customer_note: string;
  shipping: {
    address_1: string;
    address_2: string;
    city: string;
    first_name: string;
    last_name: string;
  };
  billing: {
    email: string;
    phone: string;
  };
  business: {
    address: string;
    city: string;
    name: string;
  };
}