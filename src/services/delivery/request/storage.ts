import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

const COLLECTION = 'delivery_requests';

interface UserRequestData {
  phone: string;
  lastUpdated: string;
}

export const saveUserPhone = async (userId: string, phone: string): Promise<void> => {
  const docRef = doc(db, COLLECTION, userId);
  await setDoc(docRef, {
    phone,
    lastUpdated: new Date().toISOString()
  });
};

export const getUserPhone = async (userId: string): Promise<string | null> => {
  const docRef = doc(db, COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data() as UserRequestData;
    return data.phone;
  }
  
  return null;
};