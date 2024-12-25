import React from 'react';
import { Plus } from 'lucide-react';

export const AddCompanyCard: React.FC = () => {
  const handleAddCompany = () => {
    const message = encodeURIComponent('שלום, אשמח שתוסיפו חברת משלוחים נוספת למערכת ליקוטיל');
    const whatsappUrl = `https://wa.me/972584770076?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div
      onClick={handleAddCompany}
      className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-300 cursor-pointer transition-all hover:bg-gray-50 flex flex-col items-center justify-center text-center min-h-[200px]"
    >
      <div className="bg-gray-100 rounded-full p-3 mb-4">
        <Plus size={24} className="text-gray-600" />
      </div>
      <h3 className="font-semibold text-lg mb-2">בקש חברת משלוחים</h3>
      <p className="text-sm text-gray-600">
        לא מצאת את חברת המשלוחים? נוסיף אותה תוך שעות!
      </p>
    </div>
  );
};