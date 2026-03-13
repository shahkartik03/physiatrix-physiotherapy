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
Stores all appointment records (both single treatments and package sessions).

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
  paymentMode?: 'cash' | 'upi';
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
  
  // Package-related fields (optional - only for package sessions)
  packageId?: string;            // Reference to treatmentPackages collection
  sessionNumber?: number;        // e.g., 5 (Session 5 of 20)
  isPackageSession?: boolean;    // true if part of a package
  isPrePaid?: boolean;           // true if payment already received via package
  originalAmount?: number;       // Store original amount for records
  
  // Flexibility tracking (for rescheduling)
  wasRescheduled?: boolean;      // Track if modified from original plan
  originalDoctorId?: string;     // If doctor was changed
  originalDate?: string;         // If date was changed
  originalTime?: string;         // If time was changed
  reschedulingReason?: string;   // Reason for changes
  
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
- `packageId` (to get all appointments for a package)
- `isPackageSession` (to filter package vs single appointments)
- Composite: `doctorId + date` (for doctor's daily schedule)
- Composite: `date + status` (for pending appointments on a date)
- Composite: `packageId + status` (for package session tracking)

---

### 4. **payments** (Financial Records)
Separate collection for detailed payment tracking and reports.

```typescript
{
  id: string;                    // Auto-generated unique ID
  appointmentId?: string;        // Reference to appointments (null for package payments)
  patientId: string;             // Reference to patients
  patientName: string;           // Denormalized
  doctorId: string;              // Reference to doctors
  doctorName: string;            // Denormalized
  amount: number;                // Total amount
  paymentMode: 'cash' | 'upi';
  transactionId?: string;        // For UPI payments
  commissionRate: number;        // Doctor's commission % at time of payment
  commissionAmount: number;      // Calculated commission
  netAmount: number;             // Amount after deducting commission
  paymentDate: timestamp;        // When payment was received
  receivedBy: string;            // doctorId or 'admin'
  notes?: string;
  refundAmount?: number;         // If any refund given
  refundDate?: timestamp;
  refundReason?: string;
  
  // Package-related fields
  paymentType: 'single' | 'package' | 'package_balance';  // Type of payment
  packageId?: string;            // Reference to treatmentPackages (if package payment)
  sessionsIncluded?: number;     // Number of sessions this payment covers
  
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

**Indexes:**
- `appointmentId`
- `packageId` (for package payment tracking)
- `paymentType` (to distinguish single vs package payments)
- `doctorId + paymentDate` (for doctor earnings reports)
- `paymentDate` (for monthly/yearly reports)
- `paymentMode` (to track payment method preferences)

---

### 5. **treatmentPackages**
Stores treatment packages with advance/prepaid sessions.

```typescript
{
  id: string;                    // Auto-generated unique ID
  patientId: string;             // Reference to patients collection
  patientName: string;           // Denormalized for quick access
  packageName: string;           // "Post Surgery Rehab - 20 Sessions"
  
  // Session tracking
  totalSessions: number;         // 10, 20, or 30 sessions
  completedSessions: number;     // Number of sessions completed
  remainingSessions: number;     // totalSessions - completedSessions
  
  // Financial details
  totalAmount: number;           // Total package cost in ₹
  amountPaid: number;            // Amount already paid
  amountPending: number;         // Balance remaining
  pricePerSession: number;       // totalAmount / totalSessions
  paymentMode: 'cash' | 'upi';   // Actual payment method used
  isPartialPayment: boolean;     // True if not fully paid upfront
  paymentDate: timestamp;        // Initial payment date
  transactionId?: string;        // For UPI payments
  
  // Treatment details
  treatmentType: string;         // "Physiotherapy", "Rehabilitation", etc.
  
  // Default scheduling preferences (can be overridden per appointment)
  defaultDoctorId: string;       // Default doctor for sessions
  defaultDoctorName: string;     // Denormalized
  defaultTime?: string;          // Preferred time slot (HH:MM)
  
  // Status and validity
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  startDate: string;             // Package start date (YYYY-MM-DD)
  expiryDate?: string;           // Optional validity period (YYYY-MM-DD)
  
  // Linked appointments (for tracking)
  appointmentIds: string[];      // Array of appointment IDs linked to this package
  
  notes?: string;                // General notes about the package
  createdAt: timestamp;
  updatedAt: timestamp;
  createdBy: string;             // doctorId who created the package
}
```

**Indexes:**
- `patientId` (to get all packages for a patient)
- `status` (to filter active/completed packages)
- `defaultDoctorId` (to get packages by doctor)
- `expiryDate` (to find expiring packages)
- Composite: `patientId + status` (for active patient packages)
- Composite: `status + expiryDate` (for expiry alerts)

---

### 6. **medicalRecords** (Optional - Future Enhancement)
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

### 7. **notifications** (Optional - Future Enhancement)
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
patients (1) ----< (many) treatmentPackages
treatmentPackages (1) ----< (many) appointments
appointments (1) ----< (0..1) payments  // 0 for prepaid sessions
treatmentPackages (1) ----< (1..*) payments  // 1 or more for partial payments
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

### Get active packages for a patient
```javascript
db.collection('treatmentPackages')
  .where('patientId', '==', patientId)
  .where('status', '==', 'active')
  .get()
```

### Get all appointments for a package
```javascript
db.collection('appointments')
  .where('packageId', '==', packageId)
  .orderBy('date', 'asc')
  .get()
```

### Check if patient has active package for treatment type
```javascript
db.collection('treatmentPackages')
  .where('patientId', '==', patientId)
  .where('status', '==', 'active')
  .where('treatmentType', '==', treatmentType)
  .where('remainingSessions', '>', 0)
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
