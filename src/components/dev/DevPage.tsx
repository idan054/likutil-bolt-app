import React from 'react';
import { APP_VERSION } from '../../App';

export const DevPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8" dir="ltr">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-left">Development Environment</h1>
        <div className="space-y-4">

        <div className="p-4 bg-gray-50 rounded-lg text-left">
            <h2 className="font-medium">How To Login on debugMode</h2>
            <p className="text-gray-600">1) COPY & PASTE the query params</p>
            <p className="text-gray-600">2) Replace likutil.co.il/dev/ with localhost:5173/</p>
            <p className="text-gray-600">Its because "oneTimeToken" expires!</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg text-left">
            <h2 className="font-medium">Version Info</h2>
            <p className="text-gray-600">{APP_VERSION}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg text-left">
            <h2 className="font-medium">Environment</h2>
            <p className="text-gray-600">{process.env.NODE_ENV}</p>
          </div>
        </div>
      </div>
    </div>
  );
};