import React from 'react';
import { translations } from '../../config/translations';

interface LocalPickupAlertProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  orderId: string;
}

export const LocalPickupAlert: React.FC<LocalPickupAlertProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  orderId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-right">
        <h3 className="text-lg font-semibold mb-4">
          {translations.localPickupNotice.replace('{orderId}', orderId)}
        </h3>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {translations.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {translations.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};