import React, { useState } from 'react';
import { ProductImage } from './ProductImage';
import { ProductDetails } from './ProductDetails';
import { useSettings } from '../../../hooks/useSettings';
import { getProductUrl } from '../../../utils/product';
import type { LineItem } from '../../../types/order';
import { QuantityBadge } from '../../ui/QuantityBadge';
import { Eclipse, MoreHorizontal, PanelBottomClose, X, Check, RefreshCcw, RotateCw, Divide, Loader2, BookmarkPlus, ListPlus, Diamond, PackagePlus, RectangleHorizontal, ListCollapse, LayoutList, Wrench, Settings2, Pencil, Settings, Bolt, Delete, XCircle } from 'lucide-react';
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
  const [localMetaData, setLocalMetaData] = useState(item.meta_data);

  const handleDeleteMetadata = (indexToDelete: number) => {
    setLocalMetaData((prevMetaData) => 
      prevMetaData.filter((_, index) => index !== indexToDelete)
    );
  };
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
  } = useGetAiMetadata(item.meta_data);

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

        <div className="flex items-center gap-4 flex-1">
          <ProductImage src={item.image?.src} alt={item.name} />


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
          <Wrench
            size={14}
            className={`transform transition-transform ${isMetadataOpen ? '-rotate-90' : 'rotate-0'} text-gray-400 hover:text-blue-600`}
          />

        </button>

          
          <ProductDetails 
            item={item}
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

      

      {Array.isArray(localMetaData) && localMetaData.length > 0 && (
        <div className="border-b text-sl text-gray-500 mt-1 pb-3 flex flex-col gap-1">
          {localMetaData.map((meta, index) => (
            <div key={index} className="flex items-center px-3 py-1.5 rounded-md hover:bg-gray-50 group transition-colors">
              
              
              {isMetadataOpen && (
                <button 
                  className="p-1 rounded-full hover:bg-gray-100 transition-all pl-3"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteMetadata(index);
                  }}
                >
                  <XCircle size={18} className="text-red-500" />
                </button>
              )}

          

          <div className="flex items-center gap-2 flex-1">
          <span className=" font-medium text-m text-gray-900 mt-1">{`${meta.key}`}</span>
                <span className="text-gray-400">•</span>
          <span className=" text-m text-gray-600 mt-1">{`${meta.value}`}</span>


              </div>
            </div>
          ))}
        </div>
      )}
      

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
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-700">אפשרויות זמינות</h4>
                <button
                  onClick={handleQuickConnect}
                  disabled={isLoading}
                  className={`text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${(!metadataOptions.length || error) ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'}`}
                >
                  {isLoading ? 'טוען...' : 'נסה שוב'}
                  {isLoading ? (
                    <Loader2 size={15} className="animate-spin text-blue-600" />
                  ) : (
                    <RotateCw size={15} className={(!metadataOptions.length || error) ? 'text-blue-600' : 'text-gray-500'} />
                  )}
                </button>
              </div>


              {(showResults
//  || isLoading
) && (
  <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-gray-100">
                
        
  <h4 className="text-gray-600 font-medium mb-0 flex items-center gap-2">
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>מומלץ לבחור את כל האפשרויות המתאימות</span>
  </h4>
  
              {/* <div className="space-y-3 text-gray-500 text-sm">
                
                <div className="flex items-start gap-2 p-4 bg-white/50 rounded-md">
                  <span className="text-red-500 font-bold">✗</span>
                  <div>
                    <p className="font-medium text-black">לא מומלץ - נתיב ספציפי עם ערך מוחלט</p>
                    <code className="text-xs bg-white/75 px-2 py-1 rounded">
                      $..meta_data[?(@.key=='תנאי אחריות')]
                    </code>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 p-4 bg-white/50 rounded-md">
                  <span className="text-green-500 font-bold">✓</span>
                  <div>
                    <p className="font-medium  text-black">מומלץ - נתיב דינאמי שיזהה אוטומטית תמיד</p>
                    <code className="text-xs bg-white/75 px-2 py-1 rounded">
                      $..SelectedValues..Value
                    </code>
                  </div>
                </div>
                
  
  </div> */}
  
            </div>
)}



           

              <div className="space-y-2">
                {metadataOptions.map((option) => (
                  <div 
                    key={option.index}
                    onClick={() => handleOptionSelect(option.index)}
                    className={`p-3 bg-white rounded-lg relative ${selectedOptions.includes(option.index) ? 'border-2 border-blue-600 bg-blue-50' : 'border border-gray-200'} hover:border-blue-500 cursor-pointer transition-all duration-200`}
                  >
                    {selectedOptions.includes(option.index) && (
                      <div className="absolute top-3 left-3">
                        <Check size={18} className="text-blue-600" />
                      </div>
                    )}
                    <div className="font-medium text-gray-800">{option.key}</div>
                    <div className="text-sm text-gray-600 mt-1">{option.value}</div>

                    {process.env.NODE_ENV === 'development' && (
                      <>
                        <div className="border-t border-gray-300 my-2"></div>
                        <div className="text-xs text-gray-400">{option.original_path?.label_path}</div>
                        <div className="text-xs text-gray-400">{option.original_path?.value_path}</div>
                      </>
                    )}
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