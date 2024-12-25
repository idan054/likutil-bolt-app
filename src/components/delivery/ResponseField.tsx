import React from 'react';

interface ResponseFieldProps {
  label: string;
  value: string;
}

export const ResponseField: React.FC<ResponseFieldProps> = ({ label, value }) => (
  <div className="flex flex-row-reverse justify-start gap-2">
    <span className="font-semibold">{label}:</span>
    <span>{value}</span>
  </div>
);