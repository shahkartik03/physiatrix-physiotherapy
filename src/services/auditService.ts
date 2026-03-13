/**
 * Audit Service
 * Handles logging of all database changes for accountability
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  startAfter,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'audit_logs';

export type AuditAction = 'created' | 'updated' | 'deleted' | 'status_changed' | 'payment_received';
export type AuditCollection = 'appointments' | 'patients' | 'packages' | 'doctors';

export interface AuditLog {
  id: string;
  collection: AuditCollection;
  documentId: string;
  documentName?: string; // e.g., patient name, appointment details
  action: AuditAction;
  changes?: Record<string, { old: any; new: any }>;
  userId: string;
  userName: string;
  timestamp: any;
}

export const auditService = {
  /**
   * Log an audit entry
   * @param data - Audit log data
   */
  log: async (data: {
    collection: AuditCollection;
    documentId: string;
    documentName?: string;
    action: AuditAction;
    changes?: Record<string, { old: any; new: any }>;
  }): Promise<void> => {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      const userName = localStorage.getItem('userName') || 'Unknown User';

      await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        userId,
        userName,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Error logging audit:', error);
      // Don't throw - audit logging should not break main operations
    }
  },

  /**
   * Get audit logs with filters
   * @param filters - Filter options
   * @returns Promise with array of audit logs
   */
  getLogs: async (filters?: {
    collectionType?: AuditCollection;
    userId?: string;
    action?: AuditAction;
    startDate?: string;
    endDate?: string;
    limitCount?: number;
    lastDoc?: any;
  }): Promise<AuditLog[]> => {
    try {
      const constraints: QueryConstraint[] = [];

      // Always order by timestamp descending (newest first)
      constraints.push(orderBy('timestamp', 'desc'));

      // Limit
      const limitCount = filters?.limitCount || 50;
      constraints.push(limit(limitCount));

      const q = query(collection(db, COLLECTION_NAME), ...constraints);
      const snapshot = await getDocs(q);

      let logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];

      // Apply client-side filtering to avoid complex Firestore indexes
      if (filters?.collectionType) {
        logs = logs.filter(log => log.collection === filters.collectionType);
      }
      if (filters?.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters?.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters?.startDate) {
        const startDate = new Date(filters.startDate);
        logs = logs.filter(log => {
          const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
          return logDate >= startDate;
        });
      }
      if (filters?.endDate) {
        const endDate = new Date(filters.endDate);
        logs = logs.filter(log => {
          const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
          return logDate <= endDate;
        });
      }

      return logs;
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      // If collection doesn't exist, return empty array instead of throwing
      if (error.code === 'permission-denied' || error.message?.includes('PERMISSION_DENIED')) {
        throw new Error('Permission denied. Please check Firestore rules.');
      }
      // Return empty array for other errors (like collection doesn't exist)
      return [];
    }
  },

  /**
   * Get recent logs (last 50)
   */
  getRecent: async (): Promise<AuditLog[]> => {
    return auditService.getLogs({ limitCount: 50 });
  },

  /**
   * Get logs for a specific document
   */
  getByDocument: async (
    collectionType: AuditCollection,
    documentId: string
  ): Promise<AuditLog[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('collection', '==', collectionType),
        where('documentId', '==', documentId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
    } catch (error) {
      console.error('Error fetching document audit logs:', error);
      throw new Error('Failed to fetch document audit logs');
    }
  }
};
