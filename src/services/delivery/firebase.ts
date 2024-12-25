import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { encryptData, decryptData } from '../../utils/encryption';
import type { DeliverySettings, DeliveryConnection } from '../../types/delivery';

const COLLECTION = 'delivery_settings';

export const saveDeliverySettings = async (
  userId: string,
  connection: DeliveryConnection
): Promise<void> => {
  const docRef = doc(db, COLLECTION, userId);
  
  // Get existing settings
  const docSnap = await getDoc(docRef);
  const existingSettings = docSnap.exists() 
    ? (docSnap.data() as DeliverySettings)
    : { connections: [] };
  
  // Encrypt sensitive data
  const encryptedConnection = {
    ...connection,
    key: encryptData(connection.key, userId)
  };
  
  // Update or add new connection
  const connections = existingSettings.connections.filter(
    c => c.provider !== connection.provider
  );
  connections.push(encryptedConnection);
  
  await setDoc(docRef, { connections });
};

export const getDeliverySettings = async (
  userId: string
): Promise<DeliverySettings> => {
  const docRef = doc(db, COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return { connections: [] };
  }
  
  const settings = docSnap.data() as DeliverySettings;
  
  // Decrypt sensitive data for each connection
  return {
    connections: settings.connections.map(connection => ({
      ...connection,
      key: decryptData(connection.key, userId)
    }))
  };
};