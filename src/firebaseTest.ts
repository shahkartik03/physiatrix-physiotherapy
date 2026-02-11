/**
 * Firebase Connection Test
 * Run this to verify Firebase is properly configured
 */

import { auth, db } from './config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Test 1: Check if Firebase is initialized
    console.log('✓ Firebase app initialized');
    console.log('  Project ID:', db.app.options.projectId);
    
    // Test 2: Check Auth
    console.log('✓ Firebase Auth ready');
    console.log('  Current user:', auth.currentUser?.email || 'Not logged in');
    
    // Test 3: Check Firestore
    const doctorsRef = collection(db, 'doctors');
    const snapshot = await getDocs(doctorsRef);
    console.log('✓ Firestore connected');
    console.log(`  Found ${snapshot.size} doctor(s) in database`);
    
    // Test 4: Display doctor data
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('  Doctor:', {
        id: doc.id,
        name: data.name,
        email: data.email,
        isAdmin: data.isAdmin
      });
    });
    
    console.log('\n🎉 All Firebase tests passed!');
    return true;
  } catch (error: any) {
    console.error('❌ Firebase connection error:', error.message);
    return false;
  }
};

// Auto-run test in development
if (import.meta.env.DEV) {
  testFirebaseConnection();
}
