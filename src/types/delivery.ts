import { DeliveryProgramType } from "../components/settings/tabs/sections/delivery/marketplace/AddDeliveryCompanyCard";


export interface DeliveryField {
  // id: string;
  // type: 'text' | 'password';
  label: string;
  placeholder?: string;
}

export interface DeliveryIntegration {
  index: number;
  provider: string;
  name: string;
  description: string;
  logoUrl: string;
  isConnected: boolean;
  programType: DeliveryProgramType;  
  controlPanelLink: string;
  
  username: string | undefined;
  password: string | undefined;
  token: string | undefined;
  clientId: string| undefined;
  lastTested?: string;
}


export interface DeliverySettings {
  connections: DeliveryIntegration[];
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