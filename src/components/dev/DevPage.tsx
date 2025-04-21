// import React, { useEffect, useState } from 'react';
// import { getSessionToken } from '@shopify/app-bridge-utils';
// import { app, APP_VERSION } from '../../App';
// import { BASE_URL } from '../../services/auth/woo-auth';

// export const DevPage: React.FC = () => {
//   const [serverStatus, setServerStatus] = useState<'loading' | 'online' | 'offline'>('loading');
//   const [queryParams, setQueryParams] = useState<Record<string, string>>({});
//   const [shopifyOrders, setShopifyOrders] = useState<any[]>([]);
//   const [ordersError, setOrdersError] = useState<string | null>(null);
//   const [accessToken, setAccessToken] = useState<string | null>(null);

//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const paramsObject: Record<string, string> = {};
//     params.forEach((value, key) => {
//       paramsObject[key] = value;
//     });
//     setQueryParams(paramsObject);

//     const fetchOrders = async () => {
//       try {
//         const token = await getSessionToken(app);
//         setAccessToken(token); // Store token for UI

//         const jwt_url = new URL('https://api.likutil.co.il/shopify-jwt-to-x-token');
//         await fetch(jwt_url.toString(), {
//           method: 'POST',
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         });



//         const shopId = paramsObject.shop?.split('.')[0] || 'missing-shop';
//         const url = new URL('https://api.likutil.co.il/shopify_orders');
//         url.searchParams.append('limit', '10');
//         url.searchParams.append('shopId', shopId);

//         const res = await fetch(url.toString(), {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'X-Shopify-Access-Token': token,
//             'Content-Type': 'application/json',
//           },
//         });

//         if (!res.ok) throw new Error('Failed to fetch orders');
//         const data = await res.json();
//         setShopifyOrders(data.orders || []);
//       } catch (err) {
//         console.error('Order fetch failed:', err);
//         setOrdersError('Failed to load Shopify orders');
//       }
//     };

//     const checkServerStatus = async () => {
//       try {
//         const response = await fetch(BASE_URL);
//         setServerStatus(response.status === 200 ? 'online' : 'offline');
//       } catch {
//         setServerStatus('offline');
//       }
//     };

//     fetchOrders();
//     checkServerStatus();
//     const interval = setInterval(checkServerStatus, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-100 p-8" dir="ltr">
//       <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
//         <h1 className="text-2xl font-bold mb-4 text-left">Development Environment</h1>

//         {/* Shopify Orders */}
//         <div className="p-4 bg-gray-50 rounded-lg text-left">
//           <h2 className="font-medium">Shopify Orders (Latest 10)</h2>
//           {ordersError && <p className="text-red-600 mt-2">{ordersError}</p>}
//           {!ordersError && shopifyOrders.length === 0 && <p className="text-gray-600 mt-2">No orders found.</p>}
//           <ul className="space-y-2 mt-2">
//             {shopifyOrders.map((order: any) => (
//               <li key={order.id} className="border p-3 rounded text-sm">
//                 <strong>{order.name}</strong><br />
//                 Status: {order.financial_status}<br />
//                 Total: {order.total_price} {order.currency}
//               </li>
//             ))}
//           </ul>
//         </div>

//         {/* X-Shopify-Access-Token */}
//         <div className="p-4 bg-gray-50 rounded-lg text-left mt-6 break-all">
//           <h2 className="font-medium">X-Shopify-Access-Token</h2>
//           <p className="text-gray-600">{accessToken ? accessToken : 'Token not yet loaded'}</p>
//           {accessToken && (
//             <button
//               onClick={() => navigator.clipboard.writeText(accessToken)}
//               className="mt-2 text-blue-600 underline text-sm"
//             >
//               Copy token
//             </button>
//           )}
//         </div>

//         {/* Query Parameters */}
//         <div className="p-4 bg-gray-50 rounded-lg text-left mt-6">
//           <h2 className="font-medium">Query Parameters</h2>
//           {Object.keys(queryParams).length > 0 ? (
//             <div className="mt-2">
//               {Object.entries(queryParams).map(([key, value]) => (
//                 <div key={key} className="text-gray-600">
//                   <span className="font-medium">{key}:</span> {value}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p className="text-gray-600">No query parameters present</p>
//           )}
//         </div>

//         {/* Debug Login Help */}
//         <div className="p-4 bg-gray-50 rounded-lg text-left mt-6">
//           <h2 className="font-medium">How To Login on debugMode</h2>
//           <p className="text-gray-600">1) COPY & PASTE the query params</p>
//           <p className="text-gray-600">2) Replace likutil.co.il/dev/ with localhost:5173/</p>
//           <p className="text-gray-600">Its because "oneTimeToken" expires!</p>
//         </div>

//         {/* Version Info */}
//         <div className="p-4 bg-gray-50 rounded-lg text-left mt-6">
//           <h2 className="font-medium">Version Info</h2>
//           <p className="text-gray-600">{APP_VERSION}</p>
//         </div>

//         {/* Server Status */}
//         <div className="p-4 bg-gray-50 rounded-lg text-left mt-6">
//           <h2 className="font-medium">Server Status</h2>
//           <div className="flex items-center gap-2">
//             <div className={`w-3 h-3 rounded-full ${
//               serverStatus === 'online' ? 'bg-green-500' :
//               serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
//             }`} />
//             <p className="text-gray-600">
//               api.likutil.co.il is {serverStatus === 'loading' ? 'checking...' : serverStatus}
//             </p>
//           </div>
//         </div>

//         {/* Environment Info */}
//         <div className="p-4 bg-gray-50 rounded-lg text-left mt-6">
//           <h2 className="font-medium">Environment</h2>
//           <p className="text-gray-600">{process.env.NODE_ENV}</p>
//         </div>
//       </div>
//     </div>
//   );
// };