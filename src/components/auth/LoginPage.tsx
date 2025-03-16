import React from 'react';
import { WooAuthButton } from './WooAuthButton';
import { ShieldCheck, ArrowLeft, ArrowRight, Rocket, Clock, BarChart3, Truck, Cloud, MonitorSmartphone, Camera } from 'lucide-react';
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
          {/* <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3 transform transition-all duration-300 hover:scale-105"> */}
            הממשק המשופר
          </h1>
          <p className="text-gray-400 text-lg font-medium mb-8">
          הממשק המשופר מייעל כל שלב בתהליך – מקבלת ההזמנה, דרך הליקוט ועד המשלוח וחוויית הלקוח
          </p>

          {/* Advantages Grid */}
           {/* <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl transition-all duration-300 hover:bg-blue-50">
              <Rocket className="text-blue-500 shrink-0" size={24} />
              <div className="text-right">
                <h3 className="font-semibold text-gray-900 mb-1">ייעול תהליכים</h3>
                <p className="text-sm text-gray-600">אוטומציה חכמה לניהול הזמנות ומשלוחים</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50/50 rounded-xl transition-all duration-300 hover:bg-green-50">
              <Clock className="text-green-500 shrink-0" size={24} />
              <div className="text-right">
                <h3 className="font-semibold text-gray-900 mb-1">חיסכון בזמן</h3>
                <p className="text-sm text-gray-600">ליקוט מהיר ויעיל של הזמנות</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-purple-50/50 rounded-xl transition-all duration-300 hover:bg-purple-50">
              <BarChart3 className="text-purple-500 shrink-0" size={24} />
              <div className="text-right">
                <h3 className="font-semibold text-gray-900 mb-1">ניתוח נתונים</h3>
                <p className="text-sm text-gray-600">תובנות עסקיות וניהול מלאי חכם</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-orange-50/50 rounded-xl transition-all duration-300 hover:bg-orange-50">
              <Truck className="text-orange-500 shrink-0" size={24} />
              <div className="text-right">
                <h3 className="font-semibold text-gray-900 mb-1">ניהול משלוחים</h3>
                <p className="text-sm text-gray-600">מעקב ובקרה על כל המשלוחים</p>
              </div>
            </div>
          </div>  */}


        </div>

        <div className="space-y-6">
        {/* Mobile Remote Login Message */}
          <div className="md:hidden flex items-center gap-3 justify-center text-blue-600 font-semibold text-base bg-white py-4 px-6 rounded-lg border-2 border-blue-500 mt-4">
            <span>מומלץ להכנס מהמחשב ולסרוק את הברקוד QR!</span>
            <MonitorSmartphone size={24} className="text-blue-600" />
          </div>

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
