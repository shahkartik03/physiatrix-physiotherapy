import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { TreatmentPackage, PackageAppointmentSchedule } from '../types';
import { auditService } from './auditService';

const PACKAGES_COLLECTION = 'treatmentPackages';
const APPOINTMENTS_COLLECTION = 'appointments';

/**
 * Create a new treatment package with advance payment
 */
export const createTreatmentPackage = async (
  packageData: Omit<TreatmentPackage, 'id' | 'completedSessions' | 'remainingSessions' | 'appointmentIds' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    console.log('🔥 Firebase Auth State:', {
      currentUser: auth.currentUser,
      uid: auth.currentUser?.uid,
      email: auth.currentUser?.email
    });
    
    const packagesRef = collection(db, PACKAGES_COLLECTION);
    console.log('📚 Collection reference:', PACKAGES_COLLECTION);
    
    const newPackage = {
      ...packageData,
      completedSessions: 0,
      remainingSessions: packageData.totalSessions,
      appointmentIds: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log('💾 Attempting to write package to Firestore...');
    const docRef = await addDoc(packagesRef, newPackage);
    console.log('✅ Package document created with ID:', docRef.id);
    
    // Log audit
    await auditService.log({
      collection: 'packages',
      documentId: docRef.id,
      documentName: `${packageData.patientName} - ${packageData.packageName}`,
      action: 'created'
    });
    
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error creating treatment package:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

/**
 * Convert an existing appointment to a package session (Session #1)
 */
export const convertAppointmentToPackage = async (
  appointmentId: string,
  packageId: string,
  packageData: TreatmentPackage
): Promise<void> => {
  try {
    const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
    
    // Get the current appointment
    const appointmentDoc = await getDoc(appointmentRef);
    if (!appointmentDoc.exists()) {
      throw new Error('Appointment not found');
    }
    
    const appointment = appointmentDoc.data();
    
    // Check if this session is covered by prepaid balance
    // For Session #1, check if amountPaid >= pricePerSession
    const isSessionPrepaid = packageData.amountPaid >= packageData.pricePerSession;
    
    // For Session #1, use the actual amountPaid (handles partial payments correctly)
    // If amountPaid < pricePerSession, Session #1 gets the partial amount
    const session1Amount = Math.min(packageData.amountPaid, packageData.pricePerSession);
    
    // Update the appointment to make it Session #1 of the package
    const updateData: any = {
      packageId: packageId,
      sessionNumber: 1,
      isPackageSession: true,
      isPrePaid: isSessionPrepaid,
      treatmentType: packageData.treatmentType,
      amount: session1Amount, // Use actual payment amount for Session #1
      originalAmount: packageData.pricePerSession, // Always use package session cost
      isPaid: isSessionPrepaid,
      notes: appointment.notes ? `${appointment.notes} - Converted to Session 1 of ${packageData.totalSessions}` : `Session 1 of ${packageData.totalSessions}`,
      updatedAt: new Date().toISOString(),
      updatedBy: packageData.createdBy,
    };
    
    // Only add paymentMode if session is prepaid (avoid undefined values in Firestore)
    if (isSessionPrepaid) {
      updateData.paymentMode = packageData.paymentMode;
    }
    
    await updateDoc(appointmentRef, updateData);
    
    // Update package to include this appointment
    const packageRef = doc(db, PACKAGES_COLLECTION, packageId);
    await updateDoc(packageRef, {
      appointmentIds: [appointmentId],
      updatedAt: Timestamp.now(),
    });
    
    console.log('✅ Appointment converted to package Session #1:', appointmentId, {
      isSessionPrepaid,
      amountPaid: packageData.amountPaid,
      pricePerSession: packageData.pricePerSession,
      session1Amount: session1Amount
    });
  } catch (error: any) {
    console.error('Error converting appointment to package:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      appointmentId,
      packageId
    });
    // Preserve original error for better debugging
    throw error;
  }
};

/**
 * Schedule appointments for a treatment package
 */
export const schedulePackageAppointments = async (
  packageId: string,
  appointments: PackageAppointmentSchedule[]
): Promise<void> => {
  try {
    // Get package details
    const packageDoc = await getDoc(doc(db, PACKAGES_COLLECTION, packageId));
    if (!packageDoc.exists()) {
      throw new Error('Package not found');
    }

    const packageData = { id: packageDoc.id, ...packageDoc.data() } as TreatmentPackage;

    // Validate: Don't over-schedule
    const totalScheduled = packageData.appointmentIds.length + appointments.length;
    if (totalScheduled > packageData.totalSessions) {
      throw new Error(`Cannot schedule more than ${packageData.totalSessions} sessions`);
    }

    // Create appointments
    const appointmentsRef = collection(db, APPOINTMENTS_COLLECTION);
    const appointmentIds: string[] = [];

    // Calculate how many sessions can be prepaid based on current package balance
    // Balance = Amount Paid - (Completed Sessions × Price Per Session)
    const consumedAmount = (packageData.completedSessions || 0) * packageData.pricePerSession;
    const currentPrepaidBalance = packageData.amountPaid - consumedAmount;
    const sessionsThatCanBePrepaid = Math.floor(currentPrepaidBalance / packageData.pricePerSession);

    for (let i = 0; i < appointments.length; i++) {
      const appointmentData = appointments[i];
      const sessionNumber = packageData.appointmentIds.length + i + 1;
      
      // Check if this session is covered by prepaid balance
      // Session is prepaid if there are enough remaining prepaid sessions
      const isSessionPrepaid = i < sessionsThatCanBePrepaid;

      const newAppointment: any = {
        patientId: packageData.patientId,
        patientName: packageData.patientName,
        providerId: appointmentData.doctorId,
        doctorId: appointmentData.doctorId,
        doctorName: appointmentData.doctorName,
        date: appointmentData.date,
        time: appointmentData.time,
        status: 'scheduled' as const,
        treatmentType: packageData.treatmentType,
        amount: packageData.pricePerSession,
        isPaid: isSessionPrepaid,
        
        // Package-specific fields
        packageId: packageId,
        sessionNumber: sessionNumber,
        isPackageSession: true,
        isPrePaid: isSessionPrepaid,
        originalAmount: packageData.pricePerSession,
        
        wasRescheduled: false,
        
        notes: appointmentData.notes || `Session ${sessionNumber} of ${packageData.totalSessions}${!isSessionPrepaid ? ' - Payment Required' : ''}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: packageData.createdBy,
        updatedBy: packageData.createdBy,
      };
      
      // Only add paymentMode and paymentDate if session is prepaid
      if (isSessionPrepaid) {
        newAppointment.paymentMode = packageData.paymentMode;
        newAppointment.paymentDate = new Date(packageData.paymentDate).toISOString();
      }

      const docRef = await addDoc(appointmentsRef, newAppointment);
      appointmentIds.push(docRef.id);
    }

    console.log(`✅ Scheduled ${appointments.length} appointments: ${sessionsThatCanBePrepaid} prepaid, ${appointments.length - sessionsThatCanBePrepaid} require payment`);

    // Update package with new appointment IDs
    const packageRef = doc(db, PACKAGES_COLLECTION, packageId);
    await updateDoc(packageRef, {
      appointmentIds: [...packageData.appointmentIds, ...appointmentIds],
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error('Error scheduling package appointments:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Failed to schedule package appointments: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Mark a package session as completed
 * Updates completedSessions and remainingSessions count
 * Marks package as completed when all sessions are done
 */
export const completePackageSession = async (
  packageId: string,
  appointmentId: string
): Promise<void> => {
  try {
    const packageRef = doc(db, PACKAGES_COLLECTION, packageId);
    const packageDoc = await getDoc(packageRef);

    if (!packageDoc.exists()) {
      throw new Error('Package not found');
    }

    const packageData = { id: packageDoc.id, ...packageDoc.data() } as TreatmentPackage;
    const newCompletedSessions = packageData.completedSessions + 1;
    const newRemainingSessions = packageData.totalSessions - newCompletedSessions;

    // Determine new status based on sessions and payment
    let newStatus = packageData.status;
    if (newRemainingSessions === 0) {
      // All sessions completed
      if (packageData.amountPending <= 0) {
        // Fully paid and all sessions done
        newStatus = 'completed';
      } else {
        // Sessions done but payment pending - keep as 'active' until paid
        newStatus = 'active';
      }
    }

    await updateDoc(packageRef, {
      completedSessions: newCompletedSessions,
      remainingSessions: newRemainingSessions,
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Package session completed:', {
      packageId,
      appointmentId,
      completedSessions: newCompletedSessions,
      remainingSessions: newRemainingSessions,
      status: newStatus,
      paymentPending: packageData.amountPending
    });
  } catch (error) {
    console.error('Error completing package session:', error);
    throw new Error('Failed to complete package session');
  }
};

/**
 * Reschedule a package appointment
 */
export const reschedulePackageAppointment = async (
  appointmentId: string,
  newDate: string,
  newTime: string,
  newDoctorId?: string,
  newDoctorName?: string,
  reason?: string
): Promise<void> => {
  try {
    const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
    const appointmentDoc = await getDoc(appointmentRef);

    if (!appointmentDoc.exists()) {
      throw new Error('Appointment not found');
    }

    const appointmentData = appointmentDoc.data();

    const updateData: any = {
      date: newDate,
      time: newTime,
      wasRescheduled: true,
      originalDate: appointmentData.originalDate || appointmentData.date,
      originalTime: appointmentData.originalTime || appointmentData.time,
      updatedAt: Timestamp.now(),
    };

    if (newDoctorId && newDoctorName) {
      updateData.doctorId = newDoctorId;
      updateData.doctorName = newDoctorName;
      updateData.originalDoctorId = appointmentData.originalDoctorId || appointmentData.doctorId;
    }

    if (reason) {
      updateData.reschedulingReason = reason;
    }

    await updateDoc(appointmentRef, updateData);
    
    // Log audit
    await auditService.log({
      collection: 'packages',
      documentId: appointmentId,
      action: 'updated',
      changes: {
        date: { old: appointmentData.date, new: newDate },
        time: { old: appointmentData.time, new: newTime }
      }
    });
  } catch (error) {
    console.error('Error rescheduling package appointment:', error);
    throw new Error('Failed to reschedule appointment');
  }
};

/**
 * Get package details with all appointments
 */
export const getPackageDetails = async (packageId: string): Promise<TreatmentPackage & { appointments: any[] }> => {
  try {
    const packageRef = doc(db, PACKAGES_COLLECTION, packageId);
    const packageDoc = await getDoc(packageRef);

    if (!packageDoc.exists()) {
      throw new Error('Package not found');
    }

    const packageData = { id: packageDoc.id, ...packageDoc.data() } as TreatmentPackage;

    // Get all appointments for this package
    const appointmentsQuery = query(
      collection(db, APPOINTMENTS_COLLECTION),
      where('packageId', '==', packageId),
      orderBy('date', 'asc')
    );

    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointments = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      ...packageData,
      appointments,
    };
  } catch (error) {
    console.error('Error getting package details:', error);
    throw new Error('Failed to get package details');
  }
};

/**
 * Get all active packages for a patient
 */
export const getPatientActivePackages = async (patientId: string): Promise<TreatmentPackage[]> => {
  try {
    const packagesQuery = query(
      collection(db, PACKAGES_COLLECTION),
      where('patientId', '==', patientId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(packagesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TreatmentPackage[];
  } catch (error) {
    console.error('Error getting patient active packages:', error);
    throw new Error('Failed to get patient packages');
  }
};

/**
 * Get all packages for a patient (all statuses)
 */
export const getPatientPackages = async (patientId: string): Promise<TreatmentPackage[]> => {
  try {
    const packagesQuery = query(
      collection(db, PACKAGES_COLLECTION),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(packagesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TreatmentPackage[];
  } catch (error) {
    console.error('Error getting patient packages:', error);
    throw new Error('Failed to get patient packages');
  }
};

/**
 * Check if patient has active package for specific treatment type
 */
export const checkPackageAvailability = async (
  patientId: string,
  treatmentType: string
): Promise<TreatmentPackage | null> => {
  try {
    const packagesQuery = query(
      collection(db, PACKAGES_COLLECTION),
      where('patientId', '==', patientId),
      where('status', '==', 'active'),
      where('treatmentType', '==', treatmentType),
      where('remainingSessions', '>', 0)
    );

    const snapshot = await getDocs(packagesQuery);
    
    if (snapshot.empty) {
      return null;
    }

    // Return the first active package found
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as TreatmentPackage;
  } catch (error) {
    console.error('Error checking package availability:', error);
    throw new Error('Failed to check package availability');
  }
};

/**
 * Cancel a package appointment and return session credit
 */
export const cancelPackageAppointment = async (
  packageId: string,
  appointmentId: string,
  reason?: string
): Promise<void> => {
  try {
    // Update appointment status to cancelled
    const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
    await updateDoc(appointmentRef, {
      status: 'cancelled',
      notes: reason || 'Appointment cancelled',
      updatedAt: Timestamp.now(),
    });

    // Remove appointment from package's appointmentIds array
    const packageRef = doc(db, PACKAGES_COLLECTION, packageId);
    const packageDoc = await getDoc(packageRef);

    if (packageDoc.exists()) {
      const packageData = packageDoc.data() as TreatmentPackage;
      const updatedAppointmentIds = packageData.appointmentIds.filter(id => id !== appointmentId);

      await updateDoc(packageRef, {
        appointmentIds: updatedAppointmentIds,
        updatedAt: Timestamp.now(),
      });
      
      // Log audit
      await auditService.log({
        collection: 'packages',
        documentId: packageId,
        action: 'updated',
        changes: { appointmentCancelled: { old: '', new: appointmentId } }
      });
    }
  } catch (error) {
    console.error('Error cancelling package appointment:', error);
    throw new Error('Failed to cancel package appointment');
  }
};

/**
 * Get all active packages (for dashboard/reports)
 */
export const getAllActivePackages = async (): Promise<TreatmentPackage[]> => {
  try {
    const packagesQuery = query(
      collection(db, PACKAGES_COLLECTION),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(packagesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TreatmentPackage[];
  } catch (error) {
    console.error('Error getting all active packages:', error);
    throw new Error('Failed to get active packages');
  }
};

/**
 * Get packages expiring soon (within specified days)
 */
export const getExpiringPackages = async (daysAhead: number = 7): Promise<TreatmentPackage[]> => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const packagesQuery = query(
      collection(db, PACKAGES_COLLECTION),
      where('status', '==', 'active'),
      where('expiryDate', '<=', futureDate.toISOString().split('T')[0]),
      orderBy('expiryDate', 'asc')
    );

    const snapshot = await getDocs(packagesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TreatmentPackage[];
  } catch (error) {
    console.error('Error getting expiring packages:', error);
    throw new Error('Failed to get expiring packages');
  }
};

/**
 * Calculate remaining prepaid balance for a package
 * Balance = Amount Paid - (Completed Sessions × Price Per Session)
 */
export const getPackagePrepaidBalance = (packageData: TreatmentPackage): number => {
  const consumedAmount = packageData.completedSessions * packageData.pricePerSession;
  const remainingBalance = packageData.amountPaid - consumedAmount;
  return remainingBalance;
};

/**
 * Check if a session is covered by package's prepaid balance
 * Returns true if remaining prepaid balance >= price per session
 */
export const isSessionCoveredByPrepaid = (packageData: TreatmentPackage): boolean => {
  const prepaidBalance = getPackagePrepaidBalance(packageData);
  return prepaidBalance >= packageData.pricePerSession;
};

/**
 * Get package payment status and alerts
 * Returns info about balance, whether payment is needed, and alert level
 */
export const getPackagePaymentStatus = (packageData: TreatmentPackage): {
  prepaidBalance: number;
  isBalancePositive: boolean;
  requiresPayment: boolean;
  alertLevel: 'none' | 'warning' | 'critical';
  message: string;
} => {
  // If package is fully paid (no amount pending), no alert needed
  if (packageData.amountPending <= 0) {
    return {
      prepaidBalance: 0,
      isBalancePositive: true,
      requiresPayment: false,
      alertLevel: 'none',
      message: 'Package fully paid'
    };
  }
  
  // Determine alert level based on amount pending
  let alertLevel: 'none' | 'warning' | 'critical' = 'none';
  let message = '';
  
  // Critical: Large payment pending (2+ sessions worth)
  if (packageData.amountPending >= packageData.pricePerSession * 2) {
    alertLevel = 'critical';
    message = `Payment pending: ₹${packageData.amountPending.toLocaleString()}. Please collect payment.`;
  } 
  // Warning: Some payment pending (less than 2 sessions)
  else if (packageData.amountPending > 0) {
    alertLevel = 'warning';
    message = `Payment pending: ₹${packageData.amountPending.toLocaleString()}. Collection may be needed soon.`;
  }
  
  return {
    prepaidBalance: -packageData.amountPending,
    isBalancePositive: false,
    requiresPayment: true,
    alertLevel,
    message
  };
};

/**
 * Record payment for a package session
 * Updates package's amountPaid and amountPending
 */
export const recordPackagePayment = async (
  packageId: string,
  paymentAmount: number,
  paymentMode: 'cash' | 'upi'
): Promise<void> => {
  try {
    const packageRef = doc(db, PACKAGES_COLLECTION, packageId);
    const packageDoc = await getDoc(packageRef);
    
    if (!packageDoc.exists()) {
      throw new Error('Package not found');
    }
    
    const packageData = { id: packageDoc.id, ...packageDoc.data() } as TreatmentPackage;
    const newAmountPaid = packageData.amountPaid + paymentAmount;
    const newAmountPending = packageData.totalAmount - newAmountPaid;
    
    // Update package payment records (keep original paymentMode unchanged)
    const updateData: any = {
      amountPaid: newAmountPaid,
      amountPending: newAmountPending,
      updatedAt: Timestamp.now(),
    };
    
    // If package is now fully paid and all sessions completed, mark as completed
    if (newAmountPending <= 0 && packageData.remainingSessions === 0) {
      updateData.status = 'completed';
    }
    
    await updateDoc(packageRef, updateData);
    
    console.log('💰 Package payment recorded:', {
      packageId,
      paymentAmount,
      paymentMode,
      newAmountPaid,
      newAmountPending,
      packageStatus: updateData.status || packageData.status
    });
  } catch (error) {
    console.error('Error recording package payment:', error);
    throw new Error('Failed to record package payment');
  }
};
