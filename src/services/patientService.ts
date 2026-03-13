/**
 * Patient Service
 * Handles all Firebase Firestore operations for patients
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
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Patient } from '../types';
import { auditService } from './auditService';

const COLLECTION_NAME = 'patients';

export const patientService = {
  /**
   * Create a new patient
   * @param patientData - Patient details
   * @returns Promise with the new patient ID
   */
  create: async (patientData: Omit<Patient, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...patientData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Log audit
      await auditService.log({
        collection: 'patients',
        documentId: docRef.id,
        documentName: patientData.name,
        action: 'created'
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw new Error('Failed to create patient');
    }
  },

  /**
   * Get all patients
   * @param searchTerm - Optional search term for name/phone
   * @returns Promise with array of patients
   */
  getAll: async (searchTerm?: string): Promise<Patient[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      let patients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient));
      
      // Client-side filtering for search (Firestore doesn't support LIKE queries)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        patients = patients.filter(patient => 
          patient.name.toLowerCase().includes(term) ||
          patient.phone.includes(term) ||
          (patient.email && patient.email.toLowerCase().includes(term))
        );
      }
      
      return patients;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw new Error('Failed to fetch patients');
    }
  },

  /**
   * Get single patient by ID
   * @param patientId - Patient ID
   * @returns Promise with patient data
   */
  getById: async (patientId: string): Promise<Patient | null> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, patientId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Patient;
      }
      return null;
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw new Error('Failed to fetch patient');
    }
  },

  /**
   * Search patients by phone number
   * @param phone - Phone number
   * @returns Promise with array of patients
   */
  searchByPhone: async (phone: string): Promise<Patient[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('phone', '==', phone)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient));
    } catch (error) {
      console.error('Error searching patient by phone:', error);
      throw new Error('Failed to search patient');
    }
  },

  /**
   * Search patients by email
   * @param email - Email address
   * @returns Promise with array of patients
   */
  searchByEmail: async (email: string): Promise<Patient[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('email', '==', email)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient));
    } catch (error) {
      console.error('Error searching patient by email:', error);
      throw new Error('Failed to search patient');
    }
  },

  /**
   * Update patient
   * @param patientId - Patient ID
   * @param updates - Fields to update
   * @returns Promise<void>
   */
  update: async (
    patientId: string,
    updates: Partial<Patient>
  ): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, patientId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      // Log audit
      await auditService.log({
        collection: 'patients',
        documentId: patientId,
        documentName: updates.name,
        action: 'updated',
        changes: updates as any
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      throw new Error('Failed to update patient');
    }
  },

  /**
   * Update patient medical history
   * @param patientId - Patient ID
   * @param medicalHistory - Medical history object
   * @returns Promise<void>
   */
  updateMedicalHistory: async (
    patientId: string,
    medicalHistory: {
      conditions?: string[];
      allergies?: string[];
      medications?: string[];
      surgeries?: string[];
      notes?: string;
    }
  ): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, patientId);
      await updateDoc(docRef, {
        medicalHistory,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating medical history:', error);
      throw new Error('Failed to update medical history');
    }
  },

  /**
   * Add visit note to patient
   * @param patientId - Patient ID
   * @param visitNote - Visit note details
   * @returns Promise<void>
   */
  addVisitNote: async (
    patientId: string,
    visitNote: {
      date: string;
      complaint: string;
      diagnosis: string;
      treatment: string;
      prescription?: string;
      followUp?: string;
      doctorId: string;
    }
  ): Promise<void> => {
    try {
      const patient = await patientService.getById(patientId);
      
      if (!patient) {
        throw new Error('Patient not found');
      }
      
      const existingNotes = (patient as any).visitNotes || [];
      const updatedNotes = [
        ...existingNotes,
        {
          ...visitNote,
          createdAt: new Date().toISOString()
        }
      ];
      
      const docRef = doc(db, COLLECTION_NAME, patientId);
      await updateDoc(docRef, {
        visitNotes: updatedNotes,
        lastVisit: visitNote.date,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding visit note:', error);
      throw new Error('Failed to add visit note');
    }
  },

  /**
   * Delete patient
   * @param patientId - Patient ID
   * @returns Promise<void>
   */
  delete: async (patientId: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, patientId);
      await deleteDoc(docRef);
      
      // Log audit
      await auditService.log({
        collection: 'patients',
        documentId: patientId,
        action: 'deleted'
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw new Error('Failed to delete patient');
    }
  },

  /**
   * Real-time listener for patients
   * @param callback - Function to call when data changes
   * @returns Unsubscribe function
   */
  subscribeToPatients: (
    callback: (patients: Patient[]) => void
  ) => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('name', 'asc')
      );
      
      // Return unsubscribe function
      return onSnapshot(q, (snapshot) => {
        const patients = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Patient));
        callback(patients);
      }, (error) => {
        console.error('Error in patients subscription:', error);
      });
    } catch (error) {
      console.error('Error setting up patients subscription:', error);
      // Return empty unsubscribe function
      return () => {};
    }
  },

  /**
   * Get recently added patients
   * @param limit - Number of patients to fetch
   * @returns Promise with array of patients
   */
  getRecent: async (limit: number = 10): Promise<Patient[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const patients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Patient));
      
      return patients.slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent patients:', error);
      throw new Error('Failed to fetch recent patients');
    }
  },

  /**
   * Get patients with upcoming appointments
   * @returns Promise with array of patients
   */
  getWithUpcomingAppointments: async (): Promise<Patient[]> => {
    try {
      // This would typically join with appointments collection
      // For now, get all patients and filter in the component
      return await patientService.getAll();
    } catch (error) {
      console.error('Error fetching patients with appointments:', error);
      throw new Error('Failed to fetch patients');
    }
  },

  /**
   * Get patient statistics
   * @param patientId - Patient ID
   * @returns Promise with statistics
   */
  getStatistics: async (patientId: string): Promise<{
    totalVisits: number;
    totalSpent: number;
    lastVisit: string | null;
    upcomingAppointments: number;
  }> => {
    try {
      const patient = await patientService.getById(patientId);
      
      if (!patient) {
        throw new Error('Patient not found');
      }
      
      // These would typically come from appointments collection
      // For now, return basic info from patient record
      return {
        totalVisits: (patient as any).visitNotes?.length || 0,
        totalSpent: 0, // Would calculate from appointments
        lastVisit: (patient as any).lastVisit || null,
        upcomingAppointments: 0 // Would query appointments collection
      };
    } catch (error) {
      console.error('Error fetching patient statistics:', error);
      throw new Error('Failed to fetch statistics');
    }
  },

  /**
   * Check if patient exists by phone or email
   * @param phone - Phone number
   * @param email - Email address (optional)
   * @returns Promise<boolean>
   */
  exists: async (phone: string, email?: string): Promise<boolean> => {
    try {
      const phoneResults = await patientService.searchByPhone(phone);
      
      if (phoneResults.length > 0) {
        return true;
      }
      
      if (email) {
        const emailResults = await patientService.searchByEmail(email);
        return emailResults.length > 0;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking patient existence:', error);
      return false;
    }
  }
};
