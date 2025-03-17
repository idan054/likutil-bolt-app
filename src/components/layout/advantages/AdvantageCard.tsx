import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface AdvantageCardProps {
  icon: LucideIcon;
  text: string;
  email?: string;
}

export const AdvantageCard: React.FC<AdvantageCardProps> = ({ icon: Icon, text, email }) => {
  const Wrapper = email ? 'a' : 'div';
  
  return (
    <Wrapper
      href={email ? `mailto:${email}` : undefined}
      className={`block bg-gradient-to-br from-white to-blue-50 p-4 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:bg-gradient-to-br hover:from-white hover:to-blue-100 border border-gray-100 ${
        email ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-full flex-shrink-0 shadow-inner relative before:absolute before:inset-0 before:rounded-full before:bg-blue-600/5 before:animate-pulse">
          <Icon className="text-blue-600 relative z-10" size={24} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-gray-700 font-medium text-base leading-relaxed">{text}</p>
          
        </div>
      </div>
    </Wrapper>
  );
};
