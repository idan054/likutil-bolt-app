import React, { useState } from 'react';
import { ProductImage } from './ProductImage';
import { ProductDetails } from './ProductDetails';
import { useSettings } from '../../../hooks/useSettings';
import { getProductUrl } from '../../../utils/product';
import type { LineItem } from '../../../types/order';
import { QuantityBadge } from '../../ui/QuantityBadge';
import { Eclipse, MoreHorizontal, PanelBottomClose, X, Check } from 'lucide-react';
import { useGetAiMetadata } from '../../../hooks/useGetAiMetadata';

interface OrderItemCardProps {
  item: LineItem;
  buttonPosition?: {
    top?: number;
    left?: number;
  };
  dir?: 'rtl' | 'ltr';
}



export const OrderItemCard: React.FC<OrderItemCardProps> = ({ 
  item, 
  buttonPosition = { top: -10, left: 2 },
  dir = 'rtl'
}) => {
  const { settings } = useSettings();
  const productUrl = getProductUrl(settings?.storeUrl, item.product_data?.permalink);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const {
    options: metadataOptions,
    isLoading,
    error,
    selectedOptions,
    showResults,
    fetchMetadataOptions,
    handleOptionSelect,
    handleSubmitSelection,
    setShowResults
  } = useGetAiMetadata(item.product_id);

  const handleQuickConnect = async () => {
    await fetchMetadataOptions();
    setShowResults(true);
  };

  return (
    <div className="flex flex-col" dir={dir}>
      <a 
        href={productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex justify-between items-center border-b pb-3 p-2 rounded-lg transition-colors hover:bg-blue-50 group"
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsMetadataOpen(!isMetadataOpen);
          }}
          style={{
            position: 'absolute',
            left: `${buttonPosition.left}px`,
            top: `${buttonPosition.top}px`
          }}
          className="p-1 rounded-full hover:bg-blue-100 transition-colors"
        >
          <MoreHorizontal
            size={20}
            className={`transform transition-transform ${isMetadataOpen ? 'rotate-180' : ''} text-gray-400 hover:text-blue-600`}
          />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <ProductImage src={item.image?.src} alt={item.name} />
          <ProductDetails 
            name={item.name}
            sku={item.sku}
            quantity={item.quantity}
            stockQuantity={item.product_data?.stock_quantity}
          />
        </div>
        <div className="flex flex-col items-end gap-1">
          <QuantityBadge quantity={item.quantity} />
          <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
            ₪{item.total}
          </span>
        </div>
      </a>

      {isMetadataOpen && (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
          <button
            onClick={() => setIsMetadataOpen(false)}
            className="absolute -top-1 -left-1 p-0.5 rounded-full bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <X size={14} className="text-gray-400 hover:text-blue-600" />
          </button>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="text-blue-700 font-medium mb-2">🤖 בינה מלאכותית לחיבור פלאגינים</h4>
            <p className="text-blue-600 text-sm mb-3">
              באמצעות AI מתקדם, אנו מזהים אוטומטית אפשרויות של המוצר מתוספי ה WooCommerce שלך.
              <br></br>
              בחר מההצעות כדי להעשיר את מידע המוצר שלך.
            </p>
            {!showResults ? (
              <button
                onClick={handleQuickConnect}
                disabled={isLoading}
                className={`w-full px-4 py-2 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'טוען...' : 'חיבור מהיר'}
              </button>
            ) : null}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {showResults && (
            <>
              <h4 className="font-medium text-gray-700 mb-3">אפשרויות זמינות</h4>
              <div className="space-y-2">
                {metadataOptions.map((option) => (
                  <div 
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    className={`p-3 bg-white rounded-lg relative ${selectedOptions.includes(option.id) ? 'border-2 border-blue-600 bg-blue-50' : 'border border-gray-200'} hover:border-blue-500 cursor-pointer transition-all duration-200`}
                  >
                    {selectedOptions.includes(option.id) && (
                      <div className="absolute top-3 left-3">
                        <Check size={18} className="text-blue-600" />
                      </div>
                    )}
                    <div className="font-medium text-gray-800">{option.name}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                onClick={() => {
                  handleSubmitSelection();
                  setIsMetadataOpen(false);
                }}
                disabled={selectedOptions.length === 0}
                  className={`px-4 py-2 rounded-lg transition-colors ${selectedOptions.length > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  סיים חיבור
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};