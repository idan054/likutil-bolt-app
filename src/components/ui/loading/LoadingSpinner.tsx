import React from 'react';
import { LoadingAnimation } from './LoadingAnimation';
import { LoadingText } from './LoadingText';

export const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <LoadingAnimation />
    <LoadingText />
  </div>
);