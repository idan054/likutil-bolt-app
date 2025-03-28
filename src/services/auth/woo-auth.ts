import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { FieldPath, orderBy } from 'firebase/firestore';

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
import { deleteField } from 'firebase/firestore';
import { QR_MODE_PASS } from '../../components/auth/WooAuthButton';



// export const BASE_URL = (process.env.NODE_ENV === 'development') ? 'https://0.0.0.0:8000' : 'https://api.likutil.co.il';
export const BASE_URL = 'https://api.likutil.co.il';

// interface WooAuthCallbackResponse {
//   consumer_key: string;
//   consumer_secret: string;
//   store_url: string;
//   user_id: string;
//   firebase_token?: string;
//   email?: string;
// }

// export const handleWooAuthCallback = async (code: string): Promise<void> => {
//   try {
//     const response = await fetch(
//       `${BASE_URL}/woo-auth/callback`,
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ code }),
//       }
//     );

//     if (!response.ok) {
//       throw new ApiError({
//         requestUrl: '/api/woo-auth/callback',
//         requestMethod: 'POST',
//         requestHeaders: { 'Content-Type': 'application/json' },
//         responseStatus: response.status,
//         responseStatusText: response.statusText,
//         responseBody: await response.text(),
//       });
//     }

//     const data: WooAuthCallbackResponse = await response.json();

//     // Save WooCommerce settings
//     settingsStorage.set({
//       storeUrl: data.store_url,
//       consumerKey: data.consumer_key,
//       consumerSecret: data.consumer_secret,
//     });

//     // Check if user exists and sign in
//     if (data.email) {
//       const usersRef = collection(db, 'users');
//       const q = query(usersRef, where('email', '==', data.email));
//       const snapshot = await getDocs(q);

//       // Get password from URL query params
//       const urlParams = new URLSearchParams(window.location.search);
//       const password = urlParams.get('pass');

//       if (!password) {
//         throw new Error('Missing authentication password');
//       }

//       if (!snapshot.empty) {
//         // Existing user - sign in with provided password
//         await signInWithEmailAndPassword(auth, data.email, password);
//       } else {
//         // New user - create account with provided password
//         const userCredential = await createUserWithEmailAndPassword(
//           auth,
//           data.email,
//           password
//         );

//         // Save user data
//         await setDoc(doc(db, 'users', userCredential.user.uid), {
//           email: data.email,
//           storeUrl: data.store_url,
//           createdAt: new Date().toISOString(),
//           wooUserId: data.user_id,
//           consumerKey: data.consumer_key,
//           consumerSecret: data.consumer_secret,
//           key_id: data.user_id,
//           key_permissions: 'read_write',
//         });
//       }
//     }
//   } catch (error) {
//     console.error('[woo-auth] Callback handling failed:', error);
//     throw error;
//   }
// };


export const checkExistingUser = async (storeUrl: string): Promise<{ exists: boolean }> => {
  try {
    const cleanUrl = sanitizeUrl(storeUrl);
    const usersRef = collection(db, "users");
    const q =  query(usersRef, where("storeUrl", "==", cleanUrl));

    const snapshot = await getDocs(q);
    return { exists: !snapshot.empty };
  } catch (error) {
    console.error("[checkExistingUser] Failed:", error);
    throw error;
  }
};


export const tryGetUserData = async (storeUrl: string, oneTimeToken: string) => {

  const cleanUrl = sanitizeUrl(storeUrl);
  const sendAnyway = oneTimeToken === QR_MODE_PASS;


  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef,
      ...(sendAnyway ? [
        where('storeUrl', '==', cleanUrl),
      ] : [
        where('storeUrl', '==', cleanUrl),
        where('oneTimeToken', '==', oneTimeToken),
      ]),
      orderBy('__name__') // Use "__name__" to refer to the document ID
  );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      const result = {
        exists: true,
          userId: snapshot.docs[0].id,
          email: userData.email,
      
      };
      console.log('result', result)
      return result
    }

    
  } catch (error) {
    console.error('[woo-auth] Failed to check existing user:', error);
    throw error;
  }
};

export const createFirebaseUser = async (storeUrl: string) => {
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

export const signInFirebaseUser = async (storeUrl: string) => {
  try {
    const cleanUrl = sanitizeUrl(storeUrl);
    const email = `${cleanUrl.replace(/[^a-zA-Z0-9]/g, '')}@likutil.co.il`;
    const password = generateStorePassword(cleanUrl);

    console.log('START signInWooUser()');
  

    // console.log('Email: ', email);
    // console.log('Pass: ', password);
    if (password) {
      await signInWithEmailAndPassword(auth, email, password);
    }

    return true;
  } catch (error) {
    console.error('[woo-auth] Failed to sign in user:', error);
    throw error;
  }
};


export const resetUserOneTimeToken = async (userId: string): Promise<void> => {
console.log('resetUserOneTimeToken')
console.log('userId', userId)

  try {
    const userRef = doc(db, 'users', userId);
    
    await setDoc(userRef, {
      oneTimeToken: deleteField()
    }, { merge: true });
    
  } catch (error) {
    console.error('[woo-auth] Failed to reset one-time token:', error);
    throw error;
  }
};
