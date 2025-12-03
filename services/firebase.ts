import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Helper to safely access environment variables in Vite
const getEnv = (key: string) => {
  // Check if import.meta.env exists (Vite environment)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  return undefined;
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

// Initialize Firebase only if config is present (prevents crash on load if env missing)
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.warn("Firebase initialization failed. Check your .env file.");
  // Create a dummy app/db to prevent immediate crash, though functionality will break
  app = initializeApp({ apiKey: "dummy", projectId: "dummy" }, "dummyApp"); 
}

export const db = getFirestore(app);
export const storage = getStorage(app);