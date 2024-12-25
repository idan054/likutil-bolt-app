import React from 'react';
import { Printer, ExternalLink, CheckCircle } from 'lucide-react';
import { getDeliveryUrl } from '../../../utils/delivery';
import type { DeliveryTaskResponse } from '../../../services/delivery/types';
import type { DeliveryProvider } from '../DeliverySelector';

interface DeliveryActionsProps {
  response: DeliveryTaskResponse;
  provider: DeliveryProvider;
  onComplete: () => Promise<void>;
  isCompleting: boolean;
}

export const DeliveryActions: React.FC<DeliveryActionsProps> = ({
  response,
  provider,
  onComplete,
  isCompleting,
}) => {
  if (provider === 'mahirLi') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <a
            href={response.label}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors justify-center"
          >
            <Printer size={20} />
            <span>הדפסת מדבקה</span>
          </a>

          <a
            href={response.tracking_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors justify-center"
          >
            <ExternalLink size={20} />
            <span>מעקב משלוח</span>
          </a>
        </div>

        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle size={20} />
          <span>סיום</span>
        </button>
      </div>
    );
  }

  // For Cargo and Sale4U
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <a
          href={getDeliveryUrl(provider)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors justify-center"
        >
          <Printer size={20} />
          <span>הדפסת מדבקה</span>
        </a>

        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle size={20} />
          <span>סיום</span>
        </button>
      </div>
    </div>
  );
};