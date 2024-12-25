import React from 'react';

interface TruncatedTextProps {
  text: string;
  maxLength: number;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({ text, maxLength }) => {
  if (text.length <= maxLength) return <span>{text}</span>;
  
  return (
    <span title={text}>
      {text.substring(0, maxLength)}...
    </span>
  );
};