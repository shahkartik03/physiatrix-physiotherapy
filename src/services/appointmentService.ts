/**
 * Appointment Service
 * Handles all Firebase Firestore operations for appointments
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDocsFromServer,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Appointment } from '../types';
import { auditService } from './auditService';
import { completePackageSession } from './packageService';

const COLLECTION_NAME = 'appointments';

export const appointmentService = {
  /**
   * Create a new appointment
   * @param appointmentData - Appointment details
   * @returns Promise with the new appointment ID
   */
  create: async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      // Get current user info for audit trail
      const userId = localStorage.getItem('userId') || 'unknown';
      const userName = localStorage.getItem('userName') || 'Unknown User';
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...appointmentData,
        createdBy: appointmentData.createdBy || userId,
        createdByName: appointmentData.createdByName || userName,
        updatedBy: appointmentData.updatedBy || userId,
        updatedByName: appointmentData.updatedByName || userName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Log audit
      await auditService.log({
        collection: 'appointments',
        documentId: docRef.id,
        documentName: `${appointmentData.patientName} - ${appointmentData.date}`,
        action: 'created'
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw new Error('Failed to create appointment');
    }
  },

  /**
   * Get today's appointments
   * @param doctorId - Current doctor's ID
   * @param isAdmin - Whether the user is admin
   * @returns Promise with array of appointments
   */
  getTodayAppointments: async (doctorId: string, isAdmin: boolean): Promise<Appointment[]> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      console.log('🔍 getTodayAppointments QUERY:', { doctorId, isAdmin, today });
      
      const constraints: QueryConstraint[] = [
        where('date', '==', today)
      ];
      
      // If not admin, filter by doctorId
      if (!isAdmin) {
        constraints.push(where('doctorId', '==', doctorId));
      }
      
      const q = query(
        collection(db, COLLECTION_NAME),
        ...constraints,
        orderBy('time', 'asc')
      );
      
      const snapshot = await getDocsFromServer(q);
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
      
      console.log('📋 getTodayAppointments RESULTS:', appointments.length, 'appointments');
      
      return appointments;
    } catch (error) {
      console.error('Error fetching today appointments:', error);
      throw new Error('Failed to fetch appointments');
    }
  },

  /**
   * Get upcoming appointments (future dates)
   * @param doctorId - Current doctor's ID
   * @param isAdmin - Whether the user is admin
   * @returns Promise with array of appointments
   */
  getUpcomingAppointments: async (doctorId: string, isAdmin: boolean): Promise<Appointment[]> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const constraints: QueryConstraint[] = [
        where('date', '>', today)
      ];
      
      if (!isAdmin) {
        constraints.push(where('doctorId', '==', doctorId));
      }
      
      const q = query(
        collection(db, COLLECTION_NAME),
        ...constraints,
        orderBy('date', 'asc'),
        orderBy('time', 'asc')
      );
      
      const snapshot = await getDocsFromServer(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw new Error('Failed to fetch upcoming appointments');
    }
  },

  /**
   * Get pending closure appointments (past scheduled appointments needing action)
   * @param doctorId - Current doctor's ID
   * @param isAdmin - Whether the user is admin
   * @returns Promise with array of appointments
   */
  getPendingClosure: async (doctorId: string, isAdmin: boolean): Promise<Appointment[]> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Query for both 'pending' and 'scheduled' statuses to catch all incomplete appointments
      const constraints: QueryConstraint[] = [
        where('status', 'in', ['pending', 'scheduled'])
      ];
      
      if (!isAdmin && doctorId) {
        constraints.push(where('doctorId', '==', doctorId));
      }
      
      const q = query(
        collection(db, COLLECTION_NAME),
        ...constraints
      );
      
      const snapshot = await getDocsFromServer(q);
      const allIncomplete = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
      
      // Filter for past dates client-side and sort
      const pastIncomplete = allIncomplete
        .filter(apt => apt.date < today)
        .sort((a, b) => {
          const dateCompare = b.date.localeCompare(a.date);
          if (dateCompare !== 0) return dateCompare;
          return b.time.localeCompare(a.time);
        });
      
      return pastIncomplete;
    } catch (error) {
      console.error('Error fetching pending closure appointments:', error);
      throw new Error('Failed to fetch pending closure appointments');
    }
  },

  /**
   * Get past issues (past scheduled + no-shows)
   * @param doctorId - Current doctor's ID
   * @param isAdmin - Whether the user is admin
   * @returns Promise with array of appointments
   */
  getPastIssues: async (doctorId: string, isAdmin: boolean): Promise<Appointment[]> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const constraints: QueryConstraint[] = [];
      
      if (!isAdmin && doctorId) {
        constraints.push(where('doctorId', '==', doctorId));
      }
      
      const q = constraints.length > 0
        ? query(collection(db, COLLECTION_NAME), ...constraints)
        : query(collection(db, COLLECTION_NAME));
      
      const snapshot = await getDocs(q);
      const allAppointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
      
      // Filter for past appointments with pending, scheduled or no-show status client-side and sort
      const pastIssues = allAppointments
        .filter(apt => 
          (apt.status === 'pending' || apt.status === 'scheduled' || apt.status === 'no-show') && apt.date < today
        )
        .sort((a, b) => {
          const dateCompare = b.date.localeCompare(a.date);
          if (dateCompare !== 0) return dateCompare;
          return b.time.localeCompare(a.time);
        });
      
      return pastIssues;
    } catch (error) {
      console.error('Error fetching past issues:', error);
      throw new Error('Failed to fetch past issues');
    }
  },

  /**
   * Get appointments by date range
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param doctorId - Optional doctor filter
   * @param isAdmin - Whether the user is admin
   * @returns Promise with array of appointments
   */
  getByDateRange: async (
    startDate: string,
    endDate: string,
    doctorId?: string,
    isAdmin?: boolean
  ): Promise<Appointment[]> => {
    try {
      const constraints: QueryConstraint[] = [
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      ];
      
      if (!isAdmin && doctorId) {
        constraints.push(where('doctorId', '==', doctorId));
      }
      
      const q = query(
        collection(db, COLLECTION_NAME),
        ...constraints,
        orderBy('date', 'asc'),
        orderBy('time', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
    } catch (error) {
      console.error('Error fetching appointments by date range:', error);
      throw new Error('Failed to fetch appointments');
    }
  },

  /**
   * Get appointments by status
   * @param status - Appointment status (pending, completed, cancelled, no-show)
   * @param doctorId - Current doctor's ID
   * @param isAdmin - Whether the user is admin
   * @returns Promise with array of appointments
   */
  getByStatus: async (
    status: string,
    doctorId: string,
    isAdmin: boolean
  ): Promise<Appointment[]> => {
    try {
      const constraints: QueryConstraint[] = [
        where('status', '==', status)
      ];
      
      if (!isAdmin) {
        constraints.push(where('doctorId', '==', doctorId));
      }
      
      const q = query(
        collection(db, COLLECTION_NAME),
        ...constraints,
        orderBy('date', 'desc'),
        orderBy('time', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
    } catch (error) {
      console.error('Error fetching appointments by status:', error);
      throw new Error('Failed to fetch appointments');
    }
  },

  /**
   * Get single appointment by ID
   * @param appointmentId - Appointment ID
   * @returns Promise with appointment data
   */
  getById: async (appointmentId: string): Promise<Appointment | null> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Appointment;
      }
      return null;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw new Error('Failed to fetch appointment');
    }
  },

  /**
   * Update appointment
   * @param appointmentId - Appointment ID
   * @param updates - Fields to update
   * @returns Promise<void>
   */
  update: async (
    appointmentId: string,
    updates: Partial<Appointment>
  ): Promise<void> => {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      const userName = localStorage.getItem('userName') || 'Unknown User';
      
      const updateData = {
        ...updates,
        updatedBy: userId,
        updatedByName: userName,
        updatedAt: Timestamp.now()
      };
      
      console.log('💾 UPDATING APPOINTMENT IN FIRESTORE:', {
        appointmentId,
        updates: updateData
      });
      
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      await updateDoc(docRef, updateData);
      
      console.log('✅ FIRESTORE UPDATE COMPLETED');
      
      // Log audit
      await auditService.log({
        collection: 'appointments',
        documentId: appointmentId,
        action: 'updated',
        changes: updates as any
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw new Error('Failed to update appointment');
    }
  },

  /**
   * Mark appointment as completed and add payment
   * @param appointmentId - Appointment ID
   * @param paymentData - Payment details
   * @returns Promise<void>
   */
  completeWithPayment: async (
    appointmentId: string,
    paymentData: {
      paymentMode: string;
      amount: number;
      discount: number;
      finalAmount: number;
    }
  ): Promise<void> => {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      const userName = localStorage.getItem('userName') || 'Unknown User';
      
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      await updateDoc(docRef, {
        status: 'completed',
        paymentStatus: 'paid',
        ...paymentData,
        completedAt: Timestamp.now(),
        updatedBy: userId,
        updatedByName: userName,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw new Error('Failed to complete appointment');
    }
  },

  /**
   * Cancel appointment
   * @param appointmentId - Appointment ID
   * @param reason - Cancellation reason
   * @returns Promise<void>
   */
  cancel: async (appointmentId: string, reason?: string): Promise<void> => {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      const userName = localStorage.getItem('userName') || 'Unknown User';
      
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      await updateDoc(docRef, {
        status: 'cancelled',
        cancellationReason: reason || '',
        cancelledAt: Timestamp.now(),
        updatedBy: userId,
        updatedByName: userName,
        updatedAt: Timestamp.now()
      });
      
      // Log audit
      await auditService.log({
        collection: 'appointments',
        documentId: appointmentId,
        action: 'status_changed',
        changes: { 
          status: { old: 'scheduled', new: 'cancelled' },
          reason: { old: '', new: reason || '' }
        }
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw new Error('Failed to cancel appointment');
    }
  },

  /**
   * Mark appointment as no-show
   * @param appointmentId - Appointment ID
   * @returns Promise<void>
   */
  markNoShow: async (appointmentId: string): Promise<void> => {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      const userName = localStorage.getItem('userName') || 'Unknown User';
      
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      await updateDoc(docRef, {
        status: 'no-show',
        updatedBy: userId,
        updatedByName: userName,
        updatedAt: Timestamp.now()
      });
      
      // Log audit
      await auditService.log({
        collection: 'appointments',
        documentId: appointmentId,
        action: 'status_changed',
        changes: { status: { old: 'scheduled', new: 'no-show' } }
      });
    } catch (error) {
      console.error('Error marking no-show:', error);
      throw new Error('Failed to mark as no-show');
    }
  },

  /**
   * Delete appointment
   * @param appointmentId - Appointment ID
   * @returns Promise<void>
   */
  delete: async (appointmentId: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      await deleteDoc(docRef);
      
      // Log audit
      await auditService.log({
        collection: 'appointments',
        documentId: appointmentId,
        action: 'deleted'
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw new Error('Failed to delete appointment');
    }
  },

  /**
   * Real-time listener for today's appointments
   * @param doctorId - Current doctor's ID
   * @param isAdmin - Whether the user is admin
   * @param callback - Function to call when data changes
   * @returns Unsubscribe function
   */
  subscribeToTodayAppointments: (
    doctorId: string,
    isAdmin: boolean,
    callback: (appointments: Appointment[]) => void
  ) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const constraints: QueryConstraint[] = [
        where('date', '==', today)
      ];
      
      if (!isAdmin) {
        constraints.push(where('doctorId', '==', doctorId));
      }
      
      const q = query(
        collection(db, COLLECTION_NAME),
        ...constraints,
        orderBy('time', 'asc')
      );
      
      // Return unsubscribe function
      return onSnapshot(q, (snapshot) => {
        const appointments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Appointment));
        callback(appointments);
      }, (error) => {
        console.error('Error in appointments subscription:', error);
      });
    } catch (error) {
      console.error('Error setting up appointments subscription:', error);
      // Return empty unsubscribe function
      return () => {};
    }
  },

  /**
   * Get appointments for a specific patient
   * @param patientId - Patient ID
   * @returns Promise with array of appointments
   */
  getByPatientId: async (patientId: string): Promise<Appointment[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('patientId', '==', patientId),
        orderBy('date', 'desc'),
        orderBy('time', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      throw new Error('Failed to fetch patient appointments');
    }
  },

  /**
   * Get total earnings for a date range
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param doctorId - Optional doctor filter
   * @param isAdmin - Whether the user is admin
   * @returns Promise with earnings summary
   */
  getEarningsByDateRange: async (
    startDate: string,
    endDate: string,
    doctorId?: string,
    isAdmin?: boolean
  ): Promise<{
    totalAmount: number;
    totalDiscount: number;
    finalAmount: number;
    commission: number;
    netEarnings: number;
  }> => {
    try {
      const appointments = await appointmentService.getByDateRange(
        startDate,
        endDate,
        doctorId,
        isAdmin
      );
      
      const completedAppointments = appointments.filter(
        (apt: any) => apt.status === 'completed' && apt.paymentStatus === 'paid'
      );
      
      const totalAmount = completedAppointments.reduce((sum: number, apt: any) => sum + (apt.amount || 0), 0);
      const totalDiscount = completedAppointments.reduce((sum: number, apt: any) => sum + (apt.discount || 0), 0);
      const finalAmount = completedAppointments.reduce((sum: number, apt: any) => sum + (apt.finalAmount || 0), 0);
      const commission = completedAppointments.reduce((sum: number, apt: any) => sum + (apt.commission || 0), 0);
      const netEarnings = finalAmount - commission;
      
      return {
        totalAmount,
        totalDiscount,
        finalAmount,
        commission,
        netEarnings
      };
    } catch (error) {
      console.error('Error calculating earnings:', error);
      throw new Error('Failed to calculate earnings');
    }
  },

  /**
   * Get all appointments (filtered by doctor if not admin)
   * @param doctorId - Current doctor's ID
   * @param isAdmin - Whether the user is admin
   * @returns Promise with array of appointments
   */
  getAll: async (doctorId: string, isAdmin: boolean): Promise<any[]> => {
    try {
      const constraints: QueryConstraint[] = [];
      
      // If not admin, filter by doctorId
      if (!isAdmin && doctorId) {
        constraints.push(where('doctorId', '==', doctorId));
      }
      
      // Simplified query without composite index requirement
      const q = constraints.length > 0 
        ? query(collection(db, COLLECTION_NAME), ...constraints)
        : query(collection(db, COLLECTION_NAME));
      
      const snapshot = await getDocs(q);
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return appointments;
    } catch (error) {
      console.error('Error fetching all appointments:', error);
      throw new Error('Failed to fetch appointments');
    }
  },

  /**
   * Mark appointment as paid
   * @param appointmentId - Appointment ID
   * @param paymentMode - Payment mode (cash/upi)
   * @param amount - Payment amount
   * @param notes - Optional notes
   * @returns Promise<void>
   */
  markAsPaid: async (
    appointmentId: string,
    paymentMode: 'cash' | 'upi',
    amount: number,
    notes?: string
  ): Promise<void> => {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      const userName = localStorage.getItem('userName') || 'Unknown User';
      
      // First, get the appointment to check if it's a package session
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      const appointmentDoc = await getDoc(docRef);
      
      if (!appointmentDoc.exists()) {
        throw new Error('Appointment not found');
      }
      
      const appointmentData = appointmentDoc.data() as Appointment;
      
      // Prepare update data
      const updateData: any = {
        status: 'completed',
        isPaid: true,
        paymentMode,
        paidAmount: amount,
        paymentNotes: notes || '',
        completedAt: Timestamp.now(),
        updatedBy: userId,
        updatedByName: userName,
        updatedAt: Timestamp.now()
      };
      
      // For package sessions, DO NOT modify the amount field
      // It should always reflect the service value (pricePerSession) for accurate reporting
      // For regular appointments, update amount to reflect actual payment collected
      if (!appointmentData.isPackageSession) {
        updateData.amount = amount;
      }
      
      // Update the appointment as completed and paid
      await updateDoc(docRef, updateData);
      
      // If this is a package session, update the package's completed/remaining sessions
      if (appointmentData.packageId && appointmentData.isPackageSession) {
        console.log('📦 Updating package session:', {
          packageId: appointmentData.packageId,
          appointmentId,
          sessionNumber: appointmentData.sessionNumber
        });
        
        await completePackageSession(appointmentData.packageId, appointmentId);
        console.log('✅ Package session updated successfully');
      }
      
      // Log audit
      await auditService.log({
        collection: 'appointments',
        documentId: appointmentId,
        action: 'payment_received',
        changes: { 
          status: { old: 'scheduled', new: 'completed' },
          paymentMode: { old: '', new: paymentMode },
          amount: { old: 0, new: amount }
        }
      });
    } catch (error) {
      console.error('Error marking appointment as paid:', error);
      throw new Error('Failed to mark appointment as paid');
    }
  },

  /**
   * Complete a prepaid package session without overwriting the amount field
   * This preserves the service value (pricePerSession) for accurate reporting
   * @param appointmentId - Appointment ID to complete
   */
  completePackageSessionWithoutPayment: async (
    appointmentId: string
  ): Promise<void> => {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      const userName = localStorage.getItem('userName') || 'Unknown User';
      
      // Get the appointment to verify it's a package session
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      const appointmentDoc = await getDoc(docRef);
      
      if (!appointmentDoc.exists()) {
        throw new Error('Appointment not found');
      }
      
      const appointmentData = appointmentDoc.data() as Appointment;
      
      if (!appointmentData.packageId || !appointmentData.isPackageSession) {
        throw new Error('This function is only for package sessions');
      }
      
      // Update the appointment as completed - DO NOT modify amount field
      // The amount field should already contain pricePerSession from when it was scheduled
      await updateDoc(docRef, {
        status: 'completed',
        isPaid: true,
        completedAt: Timestamp.now(),
        updatedBy: userId,
        updatedByName: userName,
        updatedAt: Timestamp.now()
      });
      
      // Update the package's completed/remaining sessions
      console.log('📦 Completing prepaid package session:', {
        packageId: appointmentData.packageId,
        appointmentId,
        sessionNumber: appointmentData.sessionNumber
      });
      
      await completePackageSession(appointmentData.packageId, appointmentId);
      console.log('✅ Package session completed successfully');
      
      // Log audit
      await auditService.log({
        collection: 'appointments',
        documentId: appointmentId,
        action: 'status_changed',
        changes: { 
          status: { old: 'scheduled', new: 'completed' }
        }
      });
    } catch (error) {
      console.error('Error completing prepaid package session:', error);
      throw new Error('Failed to complete prepaid package session');
    }
  },

  /**
   * Get all appointments for a specific package
   * @param packageId - Treatment package ID
   * @returns Promise with array of appointments
   */
  getByPackageId: async (packageId: string): Promise<Appointment[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('packageId', '==', packageId),
        orderBy('date', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
    } catch (error) {
      console.error('Error fetching package appointments:', error);
      throw new Error('Failed to fetch package appointments');
    }
  },

  /**
   * Check if an appointment is from a package
   * @param appointmentId - Appointment ID
   * @returns Promise with boolean indicating if it's a package appointment
   */
  isPackageAppointment: async (appointmentId: string): Promise<boolean> => {
    try {
      const appointment = await appointmentService.getById(appointmentId);
      return !!(appointment && appointment.packageId && appointment.isPackageSession);
    } catch (error) {
      console.error('Error checking if appointment is from package:', error);
      return false;
    }
  },

  /**
   * Get package appointments by status
   * @param packageId - Treatment package ID
   * @param status - Appointment status
   * @returns Promise with array of appointments
   */
  getPackageAppointmentsByStatus: async (
    packageId: string,
    status: string
  ): Promise<Appointment[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('packageId', '==', packageId),
        where('status', '==', status),
        orderBy('date', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
    } catch (error) {
      console.error('Error fetching package appointments by status:', error);
      throw new Error('Failed to fetch package appointments');
    }
  },

  /**
   * Get all package sessions (appointments marked as package sessions)
   * @param doctorId - Current doctor's ID
   * @param isAdmin - Whether the user is admin
   * @returns Promise with array of package appointments
   */
  getAllPackageSessions: async (
    doctorId: string,
    isAdmin: boolean
  ): Promise<Appointment[]> => {
    try {
      const constraints: QueryConstraint[] = [
        where('isPackageSession', '==', true)
      ];
      
      if (!isAdmin) {
        constraints.push(where('doctorId', '==', doctorId));
      }
      
      const q = query(
        collection(db, COLLECTION_NAME),
        ...constraints,
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
    } catch (error) {
      console.error('Error fetching package sessions:', error);
      throw new Error('Failed to fetch package sessions');
    }
  },

  /**
   * Get non-package (single) appointments
   * @param doctorId - Current doctor's ID
   * @param isAdmin - Whether the user is admin
   * @returns Promise with array of single appointments
   */
  getSingleAppointments: async (
    doctorId: string,
    isAdmin: boolean
  ): Promise<Appointment[]> => {
    try {
      const constraints: QueryConstraint[] = [];
      
      if (!isAdmin) {
        constraints.push(where('doctorId', '==', doctorId));
      }
      
      const q = constraints.length > 0
        ? query(collection(db, COLLECTION_NAME), ...constraints, orderBy('date', 'desc'))
        : query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
      
      const snapshot = await getDocs(q);
      
      // Filter out package appointments (those without packageId or isPackageSession === false)
      const appointments = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Appointment))
        .filter(apt => !apt.packageId && !apt.isPackageSession);
      
      return appointments;
    } catch (error) {
      console.error('Error fetching single appointments:', error);
      throw new Error('Failed to fetch single appointments');
    }
  }
};
