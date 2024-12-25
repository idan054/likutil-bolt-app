import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { DeliveryTaskResponse } from '../../../services/delivery/types';

interface ConnectionStatusProps {
  apiKey?: string;
  isCreating: boolean;
  deliveryResponse: DeliveryTaskResponse | null;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isCreating,
  deliveryResponse,
}) => (
  <AnimatePresence mode="wait">
    {isCreating ? (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-3 rounded-lg"
      >
        <Loader2 className="animate-spin" size={20} />
        <span>יוצר משלוח...</span>
      </motion.div>
    ) : deliveryResponse ? (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg"
      >
        <CheckCircle2 size={20} />
        <span className="font-medium">משלוח נוצר בהצלחה!</span>
      </motion.div>
    ) : null}
  </AnimatePresence>
);