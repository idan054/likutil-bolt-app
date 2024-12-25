import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface AdvantageCardProps {
  icon: LucideIcon;
  text: string;
}

export const AdvantageCard: React.FC<AdvantageCardProps> = ({ icon: Icon, text }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
    <Icon className="text-blue-600 shrink-0" size={24} />
    <span className="text-gray-700 text-right">{text}</span>
  </div>
);