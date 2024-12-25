import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { ApiError } from '../../api/types';
import type { DeliverySettings, DeliveryConnection } from '../../../types/delivery';

const COLLECTION = 'delivery_settings';

const createEmptySettings = (): DeliverySettings => ({
  connections: []
});

export const saveDeliverySettings = async (
  userId: string,
  connection: DeliveryConnection
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, userId);
    
    // Get existing settings
    const docSnap = await getDoc(docRef);
    const existingSettings = docSnap.exists() 
      ? (docSnap.data() as DeliverySettings) || createEmptySettings()
      : createEmptySettings();
    
    // Ensure connections array exists
    if (!Array.isArray(existingSettings.connections)) {
      existingSettings.connections = [];
    }
    
    // Update or add new connection
    const connections = existingSettings.connections.filter(
      c => c && c.provider !== connection.provider
    );
    connections.push(connection);
    
    await setDoc(docRef, { connections });
  } catch (error) {
    console.error('[delivery.storage.firebase] Failed to save settings:', error);
    throw new ApiError({
      requestUrl: 'firestore/delivery_settings',
      requestMethod: 'SET',
      requestHeaders: {},
      responseStatus: 500,
      responseStatusText: 'Firestore Error',
      responseBody: error instanceof Error ? error.message : 'Failed to save settings'
    });
  }
};

export const removeDeliveryConnection = async (
  userId: string,
  providerId: string
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, userId);
    
    // Get existing settings
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    
    const settings = docSnap.data() as DeliverySettings;
    
    // Remove the connection
    const connections = settings.connections.filter(
      c => c && c.provider !== providerId
    );
    
    // Save updated settings
    await setDoc(docRef, { connections });
  } catch (error) {
    console.error('[delivery.storage.firebase] Failed to remove connection:', error);
    throw new ApiError({
      requestUrl: 'firestore/delivery_settings',
      requestMethod: 'DELETE',
      requestHeaders: {},
      responseStatus: 500,
      responseStatusText: 'Firestore Error',
      responseBody: error instanceof Error ? error.message : 'Failed to remove connection'
    });
  }
};

export const getDeliverySettings = async (
  userId: string
): Promise<DeliverySettings> => {
  try {
    const docRef = doc(db, COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return createEmptySettings();
    }
    
    const settings = docSnap.data() as DeliverySettings;
    
    // Handle invalid data
    if (!settings || !Array.isArray(settings.connections)) {
      return createEmptySettings();
    }
    
    // Filter out invalid connections
    return {
      connections: settings.connections.filter(
        connection => connection && typeof connection === 'object'
      )
    };
  } catch (error) {
    console.error('[delivery.storage.firebase] Failed to load settings:', error);
    throw new ApiError({
      requestUrl: 'firestore/delivery_settings',
      requestMethod: 'GET',
      requestHeaders: {},
      responseStatus: 500,
      responseStatusText: 'Firestore Error',
      responseBody: error instanceof Error ? error.message : 'Failed to load settings'
    });
  }
};