import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SuperOrderButtonProps {
  count: number;
  onClick: () => void;
  isDisabled: boolean;
  icon: LucideIcon;
  isMobile?: boolean;
}

export const SuperOrderButton: React.FC<SuperOrderButtonProps> = ({ 
  count,
  onClick,
  isDisabled,
  icon: Icon,
  isMobile = false
}) => (
  <button
    onClick={onClick}
    disabled={isDisabled}
    className={`
      flex items-center justify-center gap-2 px-6 py-2.5 
      bg-blue-100 text-blue-600 rounded-lg 
      hover:bg-blue-200 disabled:opacity-50 
      disabled:cursor-not-allowed transition-colors
      ${isMobile ? 'w-full' : ''}
    `}
  >
    <Icon size={20} />
    <span>ליקוט מרוכז</span>
  </button>
);