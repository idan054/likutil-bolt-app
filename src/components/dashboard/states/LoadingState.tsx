import React from 'react';
import { LoadingSpinner } from '../../ui/loading';

export const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <LoadingSpinner />
  </div>
);