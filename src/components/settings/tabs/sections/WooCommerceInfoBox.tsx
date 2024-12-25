import React from 'react';
import { Info, Lock } from 'lucide-react';

export const WooCommerceInfoBox: React.FC = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
    
    <Info className="text-blue-600 shrink-0" size={24} />
    <div>
      <h4 className="font-semibold text-blue-900 mb-1">
        הגדרת חיבור ל-WooCommerce
        
      </h4>
      
      <p className="text-blue-800 text-sm">
        על מנת להתחבר לחנות שלך, יש צורך במפתח גישה לקריאה / כתיבה. ניתן ליצור אותו בלוח הבקרה תחת WooCommerce {'>'} הגדרות {'>'} מתקדם {'>'} API{' '}
        
        <a 
          href="https://rebrand.ly/biton-app-woo-api-explain" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 underline hover:text-blue-700"
        >
          צריך עזרה?
        </a>
      </p>

    

      <div className="space-y-3">
      <div className="flex items-center gap-2 text-blue-800">
        <Lock size={16} className="shrink-0" />
        <span className="text-sm">המפתחות מוצפנים ומאובטחים ב3 שכבות הגנה</span>
      </div>
    </div>
    </div>
  </div>
);