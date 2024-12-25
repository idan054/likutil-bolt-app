import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

const COLLECTION = 'users';

interface UserData {
  createdAt?: string;
  lastLogin?: Date;
}

export const getUserData = async (userId: string): Promise<UserData | null> => {
  const docRef = doc(db, COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    // Create initial user data if it doesn't exist
    const initialData: UserData = {
      createdAt: new Date().toISOString(),
      lastLogin: serverTimestamp() as Date
    };
    await setDoc(docRef, initialData);
    return initialData;
  }
  
  return docSnap.data() as UserData;
};