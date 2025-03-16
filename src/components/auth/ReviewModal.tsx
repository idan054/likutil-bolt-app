import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewModalProps {
  onClose: () => void;
  onShare: (text: string) => void;
  storeUrl?: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ onClose, onShare, storeUrl }) => {
  const [customReview, setCustomReview] = useState('');
  const reviewTemplates = [
    "מערכת מעולה! חוסכת המון זמן בניהול הזמנות 🌟",
    "השירות מדהים והתמיכה זמינה תמיד לעזור 👏",
    "הכל מאורגן בצורה נוחה ופשוטה לשימוש ✨",
    "חוסך לי המון זמן בניהול העסק, ממליץ בחום! 💪",
    "מערכת מקצועית שעוזרת לי להתמקד בצמיחת העסק 🚀"
  ];

  const handleTemplateClick = (template: string) => {
    setCustomReview(template);
  };

  const handleShareToWooGroup = () => {
    if (!customReview) return;
    
    navigator.clipboard.writeText(customReview)
      .then(() => {
        toast.success('הטקסט הועתק! שתפו אותו!');
        // Wait 1 second before redirecting
        setTimeout(() => {
          window.open('https://www.facebook.com/groups/search/groups_home/?q=%D7%95%D7%95%D7%A8%D7%93%D7%A4%D7%A8%D7%A1%20Woocommerce%20%D7%95%D7%95%D7%A7%D7%95%D7%9E%D7%A8%D7%A1', '_blank');
        }, 1000);
      })
      .catch(() => toast.error('שגיאה בהעתקה ללוח'));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">פרגנו לנו</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            aria-label="סגור"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">בחרו את המשוב שמתאים לכם ושתפו אותו:</p>
          <div className="space-y-3">
            {reviewTemplates.map((template, index) => (
              <div
                key={index}
                className="p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                onClick={() => handleTemplateClick(template)}
              >
                <p className="text-blue-900">{template}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-gray-600 mb-2">או כתבו משוב אישי:</p>
            <textarea
              value={customReview}
              onChange={(e) => setCustomReview(e.target.value)}
              placeholder="כתבו את המשוב שלכם כאן..."
              className="w-full p-3 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ביטול
          </button>
          <button
            onClick={handleShareToWooGroup}
            disabled={!customReview}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            שתף בקבוצת ווקומרס
          </button>
        </div>
      </div>
    </div>
  );
};