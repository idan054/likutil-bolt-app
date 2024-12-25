import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface TabButtonProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const TabButton: React.FC<TabButtonProps> = ({
  icon: Icon,
  label,
  isActive,
  onClick,
}) => {
  // Split label into words for mobile wrapping
  const words = label.split(' ');
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors min-w-[120px] ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={18} className="shrink-0" />
      <span className="text-sm sm:text-base leading-tight">
        {words.map((word, index) => (
          <React.Fragment key={index}>
            {word}
            {index < words.length - 1 && <br className="sm:hidden" />}
            {index < words.length - 1 && <span className="hidden sm:inline"> </span>}
          </React.Fragment>
        ))}
      </span>
    </button>
  );
};