import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { UserListItem } from '../../types/user';

export const useUsers = () => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef);
        const snapshot = await getDocs(q);
        
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          role: doc.data().role || 'client' // Set default role
        })) as UserListItem[];

        setUsers(usersData);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, isLoading };
};