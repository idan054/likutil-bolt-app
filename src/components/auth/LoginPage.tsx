import React from 'react';
import { SignInButton } from './SignInButton';
import { WooAuthButton } from './WooAuthButton';
import { SystemAdvantages } from '../layout/advantages/SystemAdvantages';
import { Package, ShieldCheck, Zap } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <img
              src="https://www.spider3d.co.il/wp-content/uploads/2024/12/Likutil-Logo-V2.png"
              alt="Likutil Logo"
              className="h-40 mx-auto mb-6"
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              מערכת ניהול הזמנות חכמה לעסקים
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              ניהול משלוחים, מעקב הזמנות ותקשורת עם לקוחות בקליק אחד
            </p>
          </div>

          {/* Sign In Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6">התחבר למערכת</h2>
              <SignInButton />
              <WooAuthButton />
              <p className="mt-4 text-sm text-gray-500">
                כניסה מאובטחת ומוגנת v1
              </p>
            </div>
          </div>

          {/* Rest of the component remains the same */}
        </div>
      </div>
    </div>
  );
};
