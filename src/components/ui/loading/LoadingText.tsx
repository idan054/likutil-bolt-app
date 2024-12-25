import React, { useState, useEffect } from 'react';

const loadingTexts = [
  'מכין את הטיל לשיגור... 🚀',
  'בודק מערכות... ⚡️',
  'מתחבר לתחנת החלל... 🛸',
  'טוען נתונים... 📡',
  'כמעט מוכן... ⭐️',
];

export const LoadingText: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((current) => (current + 1) % loadingTexts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-gray-600 text-lg animate-pulse">
      {loadingTexts[textIndex]}
    </p>
  );
};
