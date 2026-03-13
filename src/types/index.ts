export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  phone?: string; // Patient phone number for reminders
  providerId: string;
  doctorId?: string; // Alias for providerId
  doctorName?: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'canceled' | 'cancelled' | 'no-show' | 'pending';
  treatmentType?: string;
  amount?: number;
  isPaid?: boolean;
  paymentMode?: 'cash' | 'upi';
  notes?: string;
  
  // Package-related fields (optional - only for package sessions)
  packageId?: string;
  sessionNumber?: number;
  isPackageSession?: boolean;
  isPrePaid?: boolean;
  originalAmount?: number;
  wasRescheduled?: boolean;
  originalDoctorId?: string;
  originalDate?: string;
  originalTime?: string;
  reschedulingReason?: string;
  
  // Reminder tracking fields
  reminderSent?: boolean;
  reminderSentAt?: string; // ISO timestamp
  reminderSentBy?: string; // userId who sent it
  reminderSentByName?: string; // userName who sent it
  reminderMethod?: 'whatsapp' | 'sms' | 'call'; // Method used for reminder
  
  // Audit trail
  createdBy: string;
  createdByName?: string;
  updatedBy: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
};

export type TreatmentPackage = {
  id: string;
  patientId: string;
  patientName: string;
  packageName: string;
  
  // Session tracking
  totalSessions: number;
  completedSessions: number;
  remainingSessions: number;
  
  // Financial details
  totalAmount: number;
  amountPaid: number;
  amountPending: number;
  pricePerSession: number;
  paymentMode: 'cash' | 'upi';
  isPartialPayment: boolean; // True if amount paid < total amount
  paymentDate: string;
  transactionId?: string;
  
  // Treatment details
  treatmentType: string;
  
  // Default scheduling preferences
  defaultDoctorId: string;
  defaultDoctorName: string;
  defaultTime?: string;
  
  // Status and validity
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  startDate: string;
  expiryDate?: string;
  
  // Linked appointments
  appointmentIds: string[];
  
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type PackageAppointmentSchedule = {
  date: string;
  time: string;
  doctorId: string;
  doctorName: string;
  notes?: string;
};

export type Patient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
};

export type Provider = {
  id: string;
  name: string;
  specialty: string;
  availability: string[];
};

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
};

export type User = {
  id: string;
  name: string;
  role: 'doctor' | 'admin' | 'nurse';
};