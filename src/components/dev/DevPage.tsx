import React, { useState, useEffect } from 'react';
import { APP_VERSION } from '../../App';

export const DevPage: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<'loading' | 'online' | 'offline'>('loading');

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('https://api.likutil.co.il');
        setServerStatus(response.status === 200 ? 'online' : 'offline');
      } catch (error) {
        setServerStatus('offline');
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

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
            <h2 className="font-medium">Server Status</h2>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${serverStatus === 'online' ? 'bg-green-500' : serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <p className="text-gray-600">
                api.likutil.co.il is {serverStatus === 'loading' ? 'checking...' : serverStatus}
              </p>
            </div>
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