/**
 * Firebase Configuration
 * Initialize Firebase app and services
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your Firebase project config
// Get this from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyDFHWX5PJENwSvaE2AR-5zMOTt375n0ifI",
  authDomain: "physiatrix-3fb64.firebaseapp.com",
  projectId: "physiatrix-3fb64",
  storageBucket: "physiatrix-3fb64.firebasestorage.app",
  messagingSenderId: "26843558171",
  appId: "1:26843558171:web:5264cb30824c21c76523be",
  measurementId: "G-DVGF5QKEHW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
