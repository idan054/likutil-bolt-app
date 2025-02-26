import React, { useState, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';

interface TabButtonProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  onLongPress?: () => void;
  longPressTime?: number;
}

export const TabButton: React.FC<TabButtonProps> = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  onLongPress,
  longPressTime = 500,
}) => {
  const [pressing, setPressing] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout>();
  const startTime = useRef<number>();

  const handlePressStart = () => {
    setPressing(true);
    startTime.current = Date.now();
    pressTimer.current = setTimeout(() => {
      onLongPress?.();
      setPressing(false);
    }, longPressTime);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      if (Date.now() - (startTime.current || 0) < longPressTime) {
        onClick();
      }
    }
    setPressing(false);
  };

  // Split label into words for mobile wrapping
  const words = label.split(' ');
  
  return (
    <button
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors min-w-[120px] ${pressing ? 'scale-95 ' : ''}${
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