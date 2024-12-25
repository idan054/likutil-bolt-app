import React from 'react';
import { Shield, ShieldCheck, Lock } from 'lucide-react';

export const SecurityIndicator: React.FC = () => (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
    
    {/* <div className="flex items-center gap-3 mb-3">
      <div className="bg-green-100 p-2 rounded-full">
        <ShieldCheck className="text-green-600" size={24} />
      </div>
      <h4 className="font-semibold text-green-900">אבטחה מקסימלית</h4>
    </div> */}
    
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-green-800">
        <Lock size={16} className="shrink-0" />
        <span className="text-sm">גקכקכקכ מוצפנים ומאובטחים ב3 שכבות הגנה</span>
      </div>
    </div>
  </div>
);