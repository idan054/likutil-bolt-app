import React from 'react';
import { Package } from 'lucide-react';

export const LocalPickupMarker: React.FC = () => (
  <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
    <Package size={16} />
    <span>איסוף עצמי</span>
  </span>
);