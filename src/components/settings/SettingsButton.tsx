import React from 'react';
import { Settings } from 'lucide-react';

interface SettingsButtonProps {
  onClick: () => void;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
    title="הגדרות"
  >
    <Settings size={18} />
  </button>
);