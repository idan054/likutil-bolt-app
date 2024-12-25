import React from 'react';

interface CompanyHeaderProps {
  name: string;
  description: string;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({ name, description }) => (
  <div>
    <h3 className="text-xl font-semibold mb-2">{name}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);