# Physiatrix PWA - Database Design

## Overview
This document outlines the database structure for the Physiatrix medical practice management system. The design is optimized for Firebase Firestore but can be adapted for other NoSQL or SQL databases.

---

## Collections/Tables

### 1. **doctors** (Users/Providers)
Stores information about doctors and admin users.

```typescript
{
  id: string;                    // Auto-generated unique ID
  name: string;                  // Dr. Sangna Sheth
  email: string;                 // sangna@physiatrix.com (unique, indexed)
  password: string;              // Hashed password (bcrypt/Firebase Auth)
  phone: string;                 // Contact number
  specialty: string;             // Physiotherapy, Rehabilitation, etc.
  isAdmin: boolean;              // true for admin, false for regular doctor
  commissionRate: number;        // Percentage (0-100) e.g., 30
  isActive: boolean;             // Account status
  profileImage?: string;         // URL to profile photo
  qualifications?: string[];     // Array of degrees/certifications
  experience?: number;           // Years of experience
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

**Indexes:**
- `email` (unique)
- `isAdmin`
- `isActive`

---

### 2. **patients**
Stores patient information.

```typescript
{
  id: string;                    // Auto-generated unique ID
  name: string;                  // Patient full name
  phone: string;                 // Primary contact (indexed)
  email?: string;                // Optional email
  dateOfBirth: string;           // YYYY-MM-DD format
  age?: number;                  // Calculated from DOB
  gender: 'Male' | 'Female' | 'Other';
  address?: string;              // Full address
  bloodGroup?: string;           // A+, O-, etc.
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  medicalHistory?: {
    condition: string;
    diagnosedDate: string;
    notes?: string;
  }[];
  allergies?: string[];          // List of known allergies
  currentMedications?: string[]; // Current medications
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
  notes?: string;                // General notes about patient
  createdAt: timestamp;
  updatedAt: timestamp;
  createdBy: string;             // doctorId who created the record
}
```

**Indexes:**
- `phone` (for quick lookup)
- `createdAt` (for recent patients)
- `name` (for search functionality)

---

### 3. **appointments**
Stores all appointment records.

```typescript
{
  id: string;                    // Auto-generated unique ID
  patientId: string;             // Reference to patients collection
  patientName: string;           // Denormalized for quick access
  doctorId: string;              // Reference to doctors collection
  doctorName: string;            // Denormalized for quick access
  date: string;                  // YYYY-MM-DD
  time: string;                  // HH:MM (24-hour format)
  status: 'pending' | 'completed' | 'cancelled' | 'no-show';
  treatmentType: string;         // Back Pain Treatment, Consultation, etc.
  amount: number;                // Treatment cost in ₹
  isPaid: boolean;               // Payment status
  paymentMode?: 'cash' | 'upi' | 'card';
  paymentDate?: timestamp;       // When payment was received
  sessionNotes?: string;         // Treatment notes after completion
  prescriptions?: {
    medication: string;
    dosage: string;
    duration: string;
    instructions?: string;
  }[];
  nextFollowUpDate?: string;     // YYYY-MM-DD
  attachments?: string[];        // URLs to X-rays, reports, etc.
  notes?: string;                // General notes
  createdAt: timestamp;
  updatedAt: timestamp;
  createdBy: string;             // doctorId who created the appointment
}
```

**Indexes:**
- `patientId` (to get all appointments for a patient)
- `doctorId` (to get all appointments for a doctor)
- `date` (for daily schedules)
- `status` (to filter by appointment status)
- Composite: `doctorId + date` (for doctor's daily schedule)
- Composite: `date + status` (for pending appointments on a date)

---

### 4. **payments** (Financial Records)
Separate collection for detailed payment tracking and reports.

```typescript
{
  id: string;                    // Auto-generated unique ID
  appointmentId: string;         // Reference to appointments
  patientId: string;             // Reference to patients
  patientName: string;           // Denormalized
  doctorId: string;              // Reference to doctors
  doctorName: string;            // Denormalized
  amount: number;                // Total amount
  paymentMode: 'cash' | 'upi' | 'card';
  transactionId?: string;        // For UPI/card payments
  commissionRate: number;        // Doctor's commission % at time of payment
  commissionAmount: number;      // Calculated commission
  netAmount: number;             // Amount after deducting commission
  paymentDate: timestamp;        // When payment was received
  receivedBy: string;            // doctorId or 'admin'
  notes?: string;
  refundAmount?: number;         // If any refund given
  refundDate?: timestamp;
  refundReason?: string;
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

**Indexes:**
- `appointmentId`
- `doctorId + paymentDate` (for doctor earnings reports)
- `paymentDate` (for monthly/yearly reports)
- `paymentMode` (to track payment method preferences)

---

### 5. **medicalRecords** (Optional - Future Enhancement)
Detailed medical history per appointment.

```typescript
{
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  chiefComplaint: string;        // Main reason for visit
  vitals?: {
    bloodPressure?: string;      // 120/80
    heartRate?: number;          // bpm
    temperature?: number;        // °F
    weight?: number;             // kg
    height?: number;             // cm
  };
  diagnosis: string;
  treatmentGiven: string;
  prescriptions?: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  investigations?: {
    testName: string;
    report?: string;             // URL to report
    findings?: string;
  }[];
  nextVisit?: string;            // YYYY-MM-DD
  notes?: string;
  createdAt: timestamp;
  createdBy: string;             // doctorId
}
```

---

### 6. **notifications** (Optional - Future Enhancement)
For appointment reminders and notifications.

```typescript
{
  id: string;
  userId: string;                // patientId or doctorId
  userType: 'patient' | 'doctor' | 'admin';
  type: 'appointment_reminder' | 'payment_received' | 'appointment_cancelled';
  title: string;
  message: string;
  appointmentId?: string;
  isRead: boolean;
  sentVia?: 'whatsapp' | 'email' | 'sms' | 'in-app';
  sentAt: timestamp;
  createdAt: timestamp;
}
```

---

## Relationships

```
doctors (1) ----< (many) appointments
patients (1) ----< (many) appointments
appointments (1) ----< (1) payments
doctors (1) ----< (many) payments
patients (1) ----< (many) medicalRecords
appointments (1) ----< (1) medicalRecords
```

---

## Data Denormalization Strategy

For better read performance in NoSQL (Firebase):

1. **Store commonly accessed fields together** (patientName, doctorName in appointments)
2. **Duplicate data that rarely changes** (doctor commission rate at payment time)
3. **Use subcollections sparingly** - prefer flat structure for simpler queries

---

## Security Rules (Firebase Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/doctors/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Doctors collection
    match /doctors/{doctorId} {
      allow read: if isSignedIn();
      allow create: if isAdmin();
      allow update: if isAdmin() || request.auth.uid == doctorId;
      allow delete: if isAdmin();
    }
    
    // Patients collection
    match /patients/{patientId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn();
      allow delete: if isAdmin();
    }
    
    // Appointments collection
    match /appointments/{appointmentId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn();
      allow delete: if isAdmin();
    }
    
    // Payments collection
    match /payments/{paymentId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn();
      allow delete: if isAdmin();
    }
  }
}
```

---

## Query Examples

### Get today's appointments for a doctor
```javascript
db.collection('appointments')
  .where('doctorId', '==', doctorId)
  .where('date', '==', '2026-02-09')
  .where('status', '==', 'pending')
  .orderBy('time')
  .get()
```

### Get patient appointment history
```javascript
db.collection('appointments')
  .where('patientId', '==', patientId)
  .orderBy('date', 'desc')
  .limit(10)
  .get()
```

### Monthly earnings report for a doctor
```javascript
db.collection('payments')
  .where('doctorId', '==', doctorId)
  .where('paymentDate', '>=', startOfMonth)
  .where('paymentDate', '<=', endOfMonth)
  .get()
```

---

## Migration from LocalStorage to Firebase

**Current State:**
- All data stored in browser's localStorage
- No persistence across devices
- No real-time sync

**Migration Steps:**
1. Keep existing localStorage as fallback
2. Implement Firebase Authentication
3. Create Firestore collections
4. Add sync mechanism (localStorage → Firestore)
5. Add offline support (Firestore cache)
6. Gradually phase out localStorage

---

## Scalability Considerations

1. **Pagination:** Implement cursor-based pagination for large datasets
2. **Archiving:** Move old appointments (>1 year) to archive collection
3. **Caching:** Use Firebase offline persistence
4. **Indexes:** Create composite indexes for complex queries
5. **Backup:** Regular automated backups of Firestore data
6. **Cost Optimization:** Monitor read/write operations

---

## Future Enhancements

1. **Inventory Management:** Track medical supplies and equipment
2. **Staff Management:** Additional collection for non-doctor staff
3. **Billing System:** Detailed invoicing and receipts
4. **Analytics:** Dashboard with key metrics and trends
5. **WhatsApp Integration:** Automated reminders and notifications
6. **Multi-branch Support:** Add clinic/branch information

---

## Summary

This database design provides:
- ✅ Efficient data retrieval with proper indexing
- ✅ Scalable structure for future growth
- ✅ Data integrity with proper relationships
- ✅ Security with role-based access control
- ✅ Flexibility for additional features

**Next Steps:**
1. Review and approve this design
2. Set up Firebase project
3. Create Firestore collections
4. Implement Firebase Authentication
5. Migrate existing code to use Firebase SDK
