import type { DeliveryIntegration } from '../types/delivery';

export const DELIVERY_INTEGRATIONS: DeliveryIntegration[] = [
  {
    id: 'lionWheel',
    name: 'מהיר לי',
    description: 'חברת שליחויות מובילה עם משלוחים מהיום להיום',
    logoUrl:
      'https://www.spider3d.co.il/wp-content/uploads/2024/12/MahirLi-Deliver-Companies.png',
    isConnected: false,
    isBaldar: false,
    controlPanelLink: 'https://mahirli.co.il/panel',
    fields: [
      {
        id: 'key',
        label: 'מפתח התחברות',
        type: 'text',
        placeholder: 'הכנס את מפתח ההתחברות שלך',
        supportText: 'יש לבקש טוקן API מחברת המשלוחים',
        supportPhone: '0584770076',
      },
    ],
  },
  {
    id: 'cargo',
    name: 'Cargo',
    description: 'חברת שליחויות מובילה עם כיסוי ארצי',
    logoUrl:
      'https://www.spider3d.co.il/wp-content/uploads/2024/12/Cargo-Deliver-Companies.png',
    isConnected: false,
    isBaldar: true,
    controlPanelLink: 'https://cargo-ship.co.il/Baldar',
    fields: [
      {
        id: 'key',
        label: 'מפתח התחברות (קוד לקוח)',
        type: 'text',
        placeholder: 'הכנס את מפתח ההתחברות שלך',
        supportText: 'יש לבקש קוד לקוח מחברת המשלוחים',
        supportPhone: '0584770076',
      },
    ],
  },
  {
    id: 'negevExpress',
    name: 'נגב אקספרס',
    description: 'שירותי משלוחים מהירים',
    logoUrl:
      'https://www.spider3d.co.il/wp-content/uploads/2024/12/Negev-Deliver-Companies.png',
    isConnected: false,
    isBaldar: true,
    controlPanelLink: 'http://crm.negevdelivery.co.il/baldarNegev',
    fields: [
      {
        id: 'key',
        label: 'מפתח התחברות (קוד לקוח)',
        type: 'text',
        placeholder: 'הכנס את מפתח ההתחברות שלך',
        supportText: 'יש לבקש קוד לקוח מחברת המשלוחים',
        supportPhone: '0584770076',
      },
    ],
  },
  {
    id: 'kExpress',
    name: 'ק.אקספרס',
    description: 'שירותי משלוחים מהירים',
    logoUrl:
      'https://www.spider3d.co.il/wp-content/uploads/2024/12/PlaceHolder-Deliver-Companies.png',
    isConnected: false,
    isBaldar: true,
    controlPanelLink: 'https://k-express.co.il/panel',
    fields: [
      {
        id: 'key',
        label: 'מפתח התחברות',
        type: 'text',
        placeholder: 'הכנס את מפתח ההתחברות שלך',
        supportText: 'יש לבקש קוד לקוח מחברת המשלוחים',
        supportPhone: '0584770076',
      },
    ],
  },
  {
    id: 'israelMail',
    name: 'דואר ישראל',
    description: 'שירותי משלוחים מהירים',
    logoUrl:
      'https://www.spider3d.co.il/wp-content/uploads/2024/12/PlaceHolder-Deliver-Companies.png',
    isConnected: false,
    isBaldar: false,
    controlPanelLink: 'https://israelpost.co.il/panel',
    fields: [
      {
        id: 'key',
        label: 'מפתח התחברות',
        type: 'text',
        placeholder: 'הכנס את מפתח ההתחברות שלך',
        supportText: 'יש לבקש קוד לקוח מחברת המשלוחים',
        supportPhone: '0584770076',
      },
    ],
  },
  {
    id: 'HFD',
    name: 'HFD',
    description: 'שירותי משלוחים מהירים',
    logoUrl:
      'https://www.spider3d.co.il/wp-content/uploads/2024/12/PlaceHolder-Deliver-Companies.png',
    isConnected: false,
    isBaldar: false,
    controlPanelLink: 'https://hft.co.il/panel',
    fields: [
      {
        id: 'key',
        label: 'מפתח התחברות',
        type: 'text',
        placeholder: 'הכנס את מפתח ההתחברות שלך',
        supportText: 'יש לבקש קוד לקוח מחברת המשלוחים',
        supportPhone: '0584770076',
      },
    ],
  },
];
