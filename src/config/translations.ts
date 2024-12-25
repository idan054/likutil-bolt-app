export const translations = {
  title: 'מערכת ניהול הזמנות',
  subtitle: 'חפש הזמנה לפי מספר',
  searchPlaceholder: 'הזן מספר הזמנה...',
  orderNumber: 'הזמנה מספר',
  orderedOn: 'הוזמן בתאריך',
  customerDetails: 'פרטי לקוח',
  shippingAddress: 'כתובת למשלוח',
  shippingMethod: 'שיטת משלוח',
  orderItems: 'פריטים בהזמנה',
  quantity: 'כמות',
  highQuantity: 'כמות גבוהה',
  shipping: 'משלוח',
  paymentMethod: 'אמצעי תשלום',
  total: 'סה״כ',
  cancel: 'ביטול',
  confirm: 'אישור',
  localPickupNotice: 'שים לב, הזמנה #{orderId} מיועדת לאיסוף עצמי',
  customerNote: 'הערות לקוח',
  
  roles: {
    customer: 'לקוח רשום',
    guest: 'לקוח מזדמן',
    wholesale_customer: 'לקוח VIP',
    administrator: 'מנהל',
    shop_manager: 'מנהל חנות',
  },
  
  orderStatus: {
    processing: 'בטיפול',
    completed: 'הושלם',
    cancelled: 'בוטל',
    refunded: 'זוכה',
    failed: 'נכשל',
    pending: 'ממתין',
    'on-hold': 'בהמתנה',
  },
  
  deliveryOptions: {
    title: 'בחר חברת משלוחים',
    mahirLi: 'מהיר לי',
    cargo: 'Cargo',
    sale4u: 'Sale4U'
  },
  
  actions: {
    openOrder: 'פתח הזמנה',
    complete: 'סיום',
    contactWhatsapp: 'צור קשר בוואטסאפ',
    contactEmail: 'שלח אימייל'
  },
  
  orderNotes: {
    title: 'הערות להזמנה',
    placeholder: 'הוסף הערה חדשה...',
    noNotes: 'אין הערות להזמנה זו',
    addSuccess: 'הערה נוספה בהצלחה',
    addError: 'שגיאה בהוספת ההערה',
    types: {
      private: 'הערה פנימית',
      customer: 'הערה ללקוח'
    }
  }
} as const;