import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { sanitizeUrl } from '../../utils/url';
import { generateStorePassword } from '../../utils/auth/password';
import { ApiError } from '../api/types';
import { settingsStorage } from '../settings/storage';
import type { WooAuthResponse } from '../../types/auth';

interface WooAuthCallbackResponse {
  consumer_key: string;
  consumer_secret: string;
  store_url: string;
  user_id: string;
  firebase_token?: string;
  email?: string;
}

export const handleWooAuthCallback = async (code: string): Promise<void> => {
  try {
    const response = await fetch(
      'https://api.likutil.co.il/woo-auth/callback',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      }
    );

    if (!response.ok) {
      throw new ApiError({
        requestUrl: '/api/woo-auth/callback',
        requestMethod: 'POST',
        requestHeaders: { 'Content-Type': 'application/json' },
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseBody: await response.text(),
      });
    }

    const data: WooAuthCallbackResponse = await response.json();

    // Save WooCommerce settings
    settingsStorage.set({
      storeUrl: data.store_url,
      consumerKey: data.consumer_key,
      consumerSecret: data.consumer_secret,
    });

    // Check if user exists and sign in
    if (data.email) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', data.email));
      const snapshot = await getDocs(q);

      // Get password from URL query params
      const urlParams = new URLSearchParams(window.location.search);
      const password = urlParams.get('pass');

      if (!password) {
        throw new Error('Missing authentication password');
      }

      if (!snapshot.empty) {
        // Existing user - sign in with provided password
        await signInWithEmailAndPassword(auth, data.email, password);
      } else {
        // New user - create account with provided password
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          data.email,
          password
        );

        // Save user data
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: data.email,
          storeUrl: data.store_url,
          createdAt: new Date().toISOString(),
          wooUserId: data.user_id,
          consumerKey: data.consumer_key,
          consumerSecret: data.consumer_secret,
          key_id: data.user_id,
          key_permissions: 'read_write',
        });
      }
    }
  } catch (error) {
    console.error('[woo-auth] Callback handling failed:', error);
    throw error;
  }
};

export const checkExistingUser = async (storeUrl: string) => {
  const cleanUrl = sanitizeUrl(storeUrl);

  try {
    // Check if user exists in Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('storeUrl', '==', cleanUrl));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      return {
        exists: true,
        userId: snapshot.docs[0].id,
        email: userData.email,
      };
    }

    return { exists: false };
  } catch (error) {
    console.error('[woo-auth] Failed to check existing user:', error);
    throw error;
  }
};

export const createWooUser = async (storeUrl: string) => {
  const cleanUrl = sanitizeUrl(storeUrl);
  const email = `${cleanUrl.replace(/[^a-zA-Z0-9]/g, '')}@likutil.co.il`;
  const password = generateStorePassword(cleanUrl);

  try {
    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const { user } = userCredential;

    // Save initial data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      storeUrl: cleanUrl,
      createdAt: new Date().toISOString(),
      email,
    });

    return {
      firebaseId: user.uid,
      cleanUrl,
      email,
      password,
    };
  } catch (error) {
    console.error('[woo-auth] Failed to create user:', error);
    throw error;
  }
};

export const signInWooUser = async (email: string, storeUrl: string) => {
  try {
    console.log('START signInWooUser()');
    const urlParams = new URLSearchParams(window.location.search);
    const password = urlParams.get('pass');

    console.log('Email: ', email);
    console.log('Pass: ', password);
    if (password) {
      await signInWithEmailAndPassword(auth, email, password);
    }

    return true;
  } catch (error) {
    console.error('[woo-auth] Failed to sign in user:', error);
    throw error;
  }
};
