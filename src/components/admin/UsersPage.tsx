import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Store, Package, Clock } from 'lucide-react';
import { UsersList } from './UsersList';
import { useUsers } from '../../hooks/admin/useUsers';
import { useAuth } from '../../hooks/useAuth';

export const UsersPage: React.FC = () => {
  const { users, isLoading } = useUsers();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect non-admin users
  React.useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-full">
            <Users className="text-blue-600" size={24} />
          </div>
          <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
        </div>
      </div>

      <UsersList users={users} />
    </div>
  );
};