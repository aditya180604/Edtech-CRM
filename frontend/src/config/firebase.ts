import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCCjaC8Bf5M0NbyAUQEiTTACobmF8dAKJ4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'edtechcrm-dacdf.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'edtechcrm-dacdf',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'edtechcrm-dacdf.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '233603484981',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:233603484981:web:f1acbff7b8d41a1b93107c',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-PFQ2XKF271',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;