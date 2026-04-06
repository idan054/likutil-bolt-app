import React from 'react';

interface ProductImageProps {
  src?: string;
  alt: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({ src, alt }) => {
  const [error, setError] = React.useState(false);

  if (!src || error) {
    return (
      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden">
        <span className="text-gray-400 text-[10px] text-center px-1">אין תמונה</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => {
        console.warn(`[ProductImage] Failed to load: \${src}`);
        setError(true);
      }}
      className="w-16 h-16 object-cover rounded border border-gray-200 shrink-0"
    />
  );
};