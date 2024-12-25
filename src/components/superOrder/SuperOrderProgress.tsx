import React from 'react';

interface SuperOrderProgressProps {
  progress: number;
}

export const SuperOrderProgress: React.FC<SuperOrderProgressProps> = ({ progress }) => (
  <div className="px-6 py-4 border-b bg-gray-50">
    <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
      <span>התקדמות</span>
      <span>{Math.round(progress)}%</span>
    </div>
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-blue-600 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);