import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Helper to safely access environment variables in Vite
const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return String(import.meta.env[key]).trim();
  }
  return "";
};

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

// Validate config
const missingKeys = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

export const isFirebaseConfigured = missingKeys.length === 0;

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase config missing. The app will be in setup mode. Missing keys:", missingKeys);
}

// Export instances (might be undefined if config is missing)
export { app, db, storage };
