import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Printer, Truck } from 'lucide-react';
import { PaymentMethodDisplay } from './PaymentMethodDisplay';
import type { OrderDetails } from '../../types/order';
import { OrderStatusOverrideMenu } from './OrderStatusOverrideMenu';

interface LocalPickupSectionProps {
  order: OrderDetails;
  paymentMethod: string;
  showCashWarning: boolean;
  isCompleting: boolean;
  onComplete: () => Promise<void>;
  onSendAnyway: () => void;
  onStatusChanged: () => void;
}

export const LocalPickupSection: React.FC<LocalPickupSectionProps> = ({
  order,
  paymentMethod,
  showCashWarning,
  isCompleting,
  onComplete,
  onSendAnyway,
  onStatusChanged,
}) => {
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  const handleCompleteClick = async () => {
    if (showCashWarning) {
      setIsWarningOpen(true);
      return;
    }

    await onComplete();
  };

  const handleWarningConfirm = async () => {
    setIsWarningOpen(false);
    await onComplete();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            איסוף עצמי
          </h3>

          <PaymentMethodDisplay
          paymentMethod={paymentMethod}
          showHighlightedPaymentOnly={true} />

        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCompleteClick}
                disabled={isCompleting}
                className="flex flex-1 items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompleting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <CheckCircle size={20} />
                )}
                <span>סיום</span>
              </button>
              <OrderStatusOverrideMenu
                order={order}
                isDisabled={isCompleting}
                onStatusChanged={onStatusChanged}
              />
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
            >
              <Printer size={20} />
              <span>הדפסת מדבקה</span>
            </button>
          </div>
          <button
            onClick={onSendAnyway}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors w-full justify-center"
          >
            <Truck size={20} />
            <span>שלח בכל זאת</span>
          </button>
        </div>
      </div>
      {isWarningOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-2xl border-2 border-red-300 bg-white p-6 text-right shadow-2xl">
            <div className="mb-4 flex items-center justify-start gap-2 text-red-700">
              <AlertTriangle size={22} />
              <h3 className="text-xl font-extrabold">אזהרה: תשלום מזומן באיסוף עצמי</h3>
            </div>
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-base font-semibold leading-7 text-gray-800">
              שים לב הלקוח לא שילם , הוא רוצה לשלם מזומן, אין לשים בלוקר אלא להודיע ללקוח להביא תשלום ושיבוא לאסוף מהמחסן
            </p>
            <div className="mt-6 flex justify-start gap-3">
              <button
                onClick={handleWarningConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700"
              >
                קראתי והבנתי, סיים הזמנה
              </button>
              <button
                onClick={() => setIsWarningOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
