import React from 'react';
import { Shield, Store, Package, Clock } from 'lucide-react';
import type { UserListItem } from '../../types/user';
import { formatTimeAgo } from '../../utils/date';

interface UsersListProps {
  users: UserListItem[];
}

export const UsersList: React.FC<UsersListProps> = ({ users }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              משתמש
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              תפקיד
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              חנות
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              הזמנות
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              פעילות אחרונה
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <img
                    src={user.photoURL || 'https://www.gravatar.com/avatar?d=mp'}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-medium">{user.displayName || 'משתמש אנונימי'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <Shield size={14} />
                  {user.role === 'admin' ? 'מנהל' : 'לקוח'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Store size={16} className="text-gray-400" />
                  <span>{user.storeUrl || 'אין חנות'}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-gray-400" />
                  <span>{user.ordersCount || 0}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock size={16} />
                  <span>{user.lastActive ? formatTimeAgo(user.lastActive) : 'לא פעיל'}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};