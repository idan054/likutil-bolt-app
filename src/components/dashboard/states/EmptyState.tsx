import React from 'react';
import { PackageSearch } from 'lucide-react';

export const EmptyState: React.FC = () => (
  <div className="text-center py-12">
    <div className="flex justify-center mb-4">
      <div className="bg-gray-100 p-4 rounded-full">
        <PackageSearch size={32} className="text-gray-400" />
      </div>
    </div>
    <h3 className="text-lg font-semibold text-gray-700 mb-2">
      אין הזמנות בטיפול
    </h3>
    <p className="text-gray-500">
      כרגע אין הזמנות הממתינות לטיפול במערכת
    </p>
  </div>
);