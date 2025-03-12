import React from 'react';
import { WooAuthButton } from './WooAuthButton';
import { ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { AppInfoStatus } from '../ui/AppInfoStatus';

const CLOUD_BG = '/assets/images/clouds-bg-1.jpg';

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
        <a href="https://likutil.co.il" target="_self">
          <img
            src="/assets/images/white-text-logo.png"
            alt="Likutil Logo"
            className="h-10 w-auto opacity-75 cursor-pointer"
          />
        </a>
      </div>
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl relative">
        {/* Back button */}
        <a 
          href="https://likutil.co.il" 
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center gap-1 text-sm"
        >
          <ArrowRight size={16} />
          
        </a>
        <div className="text-center">
          <a href="https://likutil.co.il" target="_self" className="inline-block">
            <div className="bg-white/99 backdrop-blur-sm p-3 rounded-[24px] shadow-lg mb-6 mx-auto inline-block">
              <img
                src="/assets/images/likutil-logo-rocket-only.png"
                alt="Likutil Logo"
                className="h-14 w-auto transform -rotate-[30deg] transition-transform duration-300 hover:scale-105 cursor-pointer"
              />
            </div>
          </a>
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
