import React from 'react';
import { AdvantageCard } from './AdvantageCard';
import { advantages } from './advantagesList';

export const SystemAdvantages: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {advantages.map((advantage, index) => (
      <AdvantageCard 
        key={index} 
        icon={advantage.icon} 
        text={advantage.text} 
      />
    ))}
  </div>
);