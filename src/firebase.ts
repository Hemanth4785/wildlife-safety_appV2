import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

// Firebase Project Credentials
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAnUXaLav6xcXVlOEaOyla3bA_HrUs5zc4",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "wildlife-safety-d9769.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "wildlife-safety-d9769",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "wildlife-safety-d9769.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "325909210316",
  appId: env.VITE_FIREBASE_APP_ID || "1:325909210316:web:wildlifesafetyd9769",
  ...(env.VITE_FIREBASE_MEASUREMENT_ID ? { measurementId: env.VITE_FIREBASE_MEASUREMENT_ID } : {})
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Safe Analytics Initialization - only initialize if measurementId or explicit env is configured
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined' && env.VITE_FIREBASE_MEASUREMENT_ID) {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (_e) {
        // Safe fallback if Analytics is disabled on the project
      }
    }
  }).catch(() => {
    // Ignore analytics support errors
  });
}

export default app;
