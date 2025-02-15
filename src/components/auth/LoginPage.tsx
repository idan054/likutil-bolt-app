import React from 'react';
import { WooAuthButton } from './WooAuthButton';
import { ShieldCheck } from 'lucide-react';
import { AppInfoStatus } from '../ui/AppInfoStatus';

const CLOUD_BG = '/src/assets/images/clouds-bg-1.jpg';

export const LoginPage: React.FC = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${CLOUD_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Top-left logo */}
      <div className="absolute top-6 right-8">
        <img
          src="/src/assets/images/white-text-logo.png"
          alt="Likutil Logo"
          className="h-10 w-auto opacity-75"
        />
      </div>
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
        <div className="text-center">
          <div className="bg-white/80 backdrop-blur-sm p-3 rounded-[24px] shadow-lg mb-6 mx-auto inline-block">
            <img
              src="/src/assets/images/likutil-logo-rocket-only.png"
              alt="Likutil Logo"
              className="h-14 w-auto transform -rotate-[30deg] transition-transform duration-300 hover:scale-105"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            הממשק המשופר
          </h1>
          <p className="text-gray-400 text-lg font-medium mb-8">
          הממשק המשופר מייעל כל שלב בתהליך – מקבלת ההזמנה, דרך הליקוט ועד המשלוח וחוויית הלקוח
          </p>
        </div>

        <div className="space-y-6">
          <WooAuthButton />
          <div className="flex items-center gap-2 justify-center text-gray-500 text-sm bg-gray-50 py-2 px-4 rounded-lg">
            <ShieldCheck size={16} className="text-green-500" />
            <span>כניסה מאובטחת ומוגנת</span>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          <AppInfoStatus />
        </div>
      </div>
    </div>
  );
};
