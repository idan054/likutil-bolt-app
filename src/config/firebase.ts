import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDZ609tpVpSrWfOKVHVoyo9DK8dbYqAtRE",
  authDomain: "likutil.firebaseapp.com",
  projectId: "likutil",
  storageBucket: "likutil.firebasestorage.app",
  messagingSenderId: "314662541049",
  appId: "1:314662541049:web:9e6efa3430e1be4f47f428",
  measurementId: "G-VYRKS8Z4EX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure language
auth.useDeviceLanguage();