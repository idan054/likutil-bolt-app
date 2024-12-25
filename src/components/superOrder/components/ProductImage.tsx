import React from 'react';

interface ProductImageProps {
  src?: string;
  alt: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({ src, alt }) => {
  if (!src) {
    return (
      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
        <span className="text-gray-400 text-xs">אין תמונה</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      className="w-16 h-16 object-cover rounded border border-gray-200"
    />
  );
};