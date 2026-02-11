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

const COLLECTION_NAME = 'appointments';

export const appointmentService = {
  /**
   * Create a new appointment
   * @param appointmentData - Appointment details
   * @returns Promise with the new appointment ID
   */
  create: async (appointmentData: Omit<Appointment, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...appointmentData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
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
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
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
      
      const snapshot = await getDocs(q);
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
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
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
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      await updateDoc(docRef, {
        status: 'completed',
        paymentStatus: 'paid',
        ...paymentData,
        completedAt: Timestamp.now(),
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
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      await updateDoc(docRef, {
        status: 'cancelled',
        cancellationReason: reason || '',
        cancelledAt: Timestamp.now(),
        updatedAt: Timestamp.now()
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
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      await updateDoc(docRef, {
        status: 'no-show',
        updatedAt: Timestamp.now()
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
      const docRef = doc(db, COLLECTION_NAME, appointmentId);
      await updateDoc(docRef, {
        status: 'completed',
        isPaid: true,
        paymentMode,
        paidAmount: amount,
        paymentNotes: notes || '',
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marking appointment as paid:', error);
      throw new Error('Failed to mark appointment as paid');
    }
  }
};
