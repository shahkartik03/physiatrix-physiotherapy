/**
 * User Management Service
 * Handles doctor account creation and management
 */

import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, collection, getDocs, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { auditService } from './auditService';

export interface DoctorProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  isAdmin: boolean;
  createdAt: string;
  createdBy?: string;
  isActive: boolean;
}

/**
 * Create a new doctor account (Admin function)
 * Creates Firebase Auth account and Firestore profile
 */
export const createDoctorAccount = async (doctorData: {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  isAdmin: boolean;
  temporaryPassword: string;
  commissionRate?: number;
  startTime?: string;
  endTime?: string;
  sendEmail?: boolean;
}): Promise<{ success: boolean; message: string; uid?: string }> => {
  try {
    // CRITICAL FIX: Get admin email from localStorage BEFORE creating new user
    // because createUserWithEmailAndPassword automatically signs in the new user
    const adminEmail = localStorage.getItem('userEmail') || 'admin';
    
    // Note: Creating users with email/password requires Firebase admin SDK in production
    // For now, we'll use client SDK which creates the user and signs them in
    // In production, this should be moved to a Cloud Function
    
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      doctorData.email,
      doctorData.temporaryPassword
    );
    
    const newUser = userCredential.user;
    
    // Create doctor profile in Firestore
    const doctorProfile: any = {
      uid: newUser.uid,
      name: doctorData.name,
      email: doctorData.email,
      phone: doctorData.phone,
      specialty: doctorData.specialty,
      isAdmin: doctorData.isAdmin,
      createdAt: new Date().toISOString(),
      createdBy: adminEmail,
      isActive: true,
    };
    
    // Add optional fields if provided
    if (doctorData.commissionRate !== undefined) {
      doctorProfile.commissionRate = doctorData.commissionRate;
    }
    if (doctorData.startTime) {
      doctorProfile.startTime = doctorData.startTime;
    }
    if (doctorData.endTime) {
      doctorProfile.endTime = doctorData.endTime;
    }
    
    await setDoc(doc(db, 'doctors', newUser.uid), doctorProfile);
    
    // Log audit
    await auditService.log({
      collection: 'doctors',
      documentId: newUser.uid,
      documentName: doctorData.name,
      action: 'created'
    });
    
    // Send password reset email only if requested (default: false for backward compatibility)
    const shouldSendEmail = doctorData.sendEmail === true;
    if (shouldSendEmail) {
      await sendPasswordResetEmail(auth, doctorData.email);
    }
    
    console.log('✅ Doctor account created:', {
      uid: newUser.uid,
      email: doctorData.email,
      name: doctorData.name,
      emailSent: shouldSendEmail,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      message: shouldSendEmail 
        ? 'Doctor account created successfully. Password reset email sent.'
        : 'Doctor account created successfully.',
      uid: newUser.uid
    };
  } catch (error: any) {
    console.error('Error creating doctor account:', error);
    
    let errorMessage = 'Failed to create doctor account.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Use at least 6 characters.';
    } else {
      errorMessage = error.message || errorMessage;
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    await sendPasswordResetEmail(auth, email);
    
    console.log('📧 Password reset email sent to:', email);
    
    return {
      success: true,
      message: 'Password reset email sent. Please check your inbox.'
    };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    
    let errorMessage = 'Failed to send password reset email.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else {
      errorMessage = error.message || errorMessage;
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Change user's own password (requires current password for security)
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      return {
        success: false,
        message: 'No user is currently logged in.'
      };
    }
    
    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await updatePassword(user, newPassword);
    
    console.log('🔐 Password changed successfully for:', user.email);
    
    return {
      success: true,
      message: 'Password changed successfully.'
    };
  } catch (error: any) {
    console.error('Error changing password:', error);
    
    let errorMessage = 'Failed to change password.';
    
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Current password is incorrect.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'New password is too weak. Use at least 6 characters.';
    } else {
      errorMessage = error.message || errorMessage;
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Get all doctors (Admin function)
 */
export const getAllDoctors = async (): Promise<DoctorProfile[]> => {
  try {
    const doctorsSnapshot = await getDocs(collection(db, 'doctors'));
    const doctors: DoctorProfile[] = [];
    
    doctorsSnapshot.forEach((doc) => {
      doctors.push({
        uid: doc.id, // CRITICAL: Get the document ID as uid
        ...doc.data()
      } as DoctorProfile);
    });
    
    return doctors.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
};

/**
 * Update doctor profile (Admin function)
 */
export const updateDoctorProfile = async (
  uid: string,
  updates: Partial<DoctorProfile>
): Promise<{ success: boolean; message: string }> => {
  try {
    const doctorRef = doc(db, 'doctors', uid);
    await updateDoc(doctorRef, updates);
    
    // Log audit
    await auditService.log({
      collection: 'doctors',
      documentId: uid,
      documentName: updates.name,
      action: 'updated',
      changes: updates as any
    });
    
    console.log('✅ Doctor profile updated:', uid);
    
    return {
      success: true,
      message: 'Doctor profile updated successfully.'
    };
  } catch (error: any) {
    console.error('Error updating doctor profile:', error);
    return {
      success: false,
      message: error.message || 'Failed to update doctor profile.'
    };
  }
};

/**
 * Deactivate doctor account (Admin function)
 * Note: This doesn't delete the Firebase Auth account, just marks as inactive
 */
export const deactivateDoctorAccount = async (uid: string): Promise<{ success: boolean; message: string }> => {
  try {
    const doctorRef = doc(db, 'doctors', uid);
    await updateDoc(doctorRef, { isActive: false });
    
    // Log audit
    await auditService.log({
      collection: 'doctors',
      documentId: uid,
      action: 'updated',
      changes: { isActive: { old: true, new: false } }
    });
    
    console.log('⚠️ Doctor account deactivated:', uid);
    
    return {
      success: true,
      message: 'Doctor account deactivated.'
    };
  } catch (error: any) {
    console.error('Error deactivating doctor account:', error);
    return {
      success: false,
      message: error.message || 'Failed to deactivate doctor account.'
    };
  }
};

/**
 * Reactivate doctor account (Admin function)
 */
export const reactivateDoctorAccount = async (uid: string): Promise<{ success: boolean; message: string }> => {
  try {
    const doctorRef = doc(db, 'doctors', uid);
    await updateDoc(doctorRef, { isActive: true });
    
    console.log('✅ Doctor account reactivated:', uid);
    
    return {
      success: true,
      message: 'Doctor account reactivated.'
    };
  } catch (error: any) {
    console.error('Error reactivating doctor account:', error);
    return {
      success: false,
      message: error.message || 'Failed to reactivate doctor account.'
    };
  }
};
