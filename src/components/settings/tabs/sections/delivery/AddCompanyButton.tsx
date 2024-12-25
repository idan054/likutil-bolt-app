import React from 'react';
import { Plus } from 'lucide-react';

export const AddCompanyButton: React.FC = () => {
  const handleAddCompany = () => {
    const message = encodeURIComponent('שלום, אשמח שתוסיפו חברת משלוחים נוספת למערכת ליקוטיל');
    const whatsappUrl = `https://wa.me/972584770076?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleAddCompany}
      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
    >
      <Plus size={20} />
      <span>הוסף חברה</span>
    </button>
  );
};