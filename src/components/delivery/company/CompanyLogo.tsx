import React from 'react';

interface CompanyLogoProps {
  src: string;
  name: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ src, name }) => (
  <div className="shrink-0 flex justify-center">
    <img
      src={src}
      alt={name}
      className="w-20 h-20 md:w-24 md:h-24 object-contain"
    />
  </div>
);