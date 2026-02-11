export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address?: string;
  medicalHistory: MedicalHistory[];
  createdAt: string;
}

export interface MedicalHistory {
  condition: string;
  diagnosed: string;
  treatment: string;
  notes?: string;
}

export const patients: Patient[] = [
  {
    id: 'pat-1',
    name: 'Rajesh Sharma',
    phone: '9876543210',
    email: 'rajesh.sharma@gmail.com',
    dateOfBirth: '1985-03-15',
    gender: 'Male',
    address: 'Lodha Signet A, Kolshet, Thane West',
    medicalHistory: [
      {
        condition: 'Lower Back Pain',
        diagnosed: '2024-01-10',
        treatment: 'Physiotherapy sessions',
        notes: 'Improving with regular sessions',
      },
    ],
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'pat-2',
    name: 'Priya Mehta',
    phone: '9876543211',
    email: 'priya.mehta@gmail.com',
    dateOfBirth: '1990-07-22',
    gender: 'Female',
    address: 'Hiranandani Estate, Thane',
    medicalHistory: [
      {
        condition: 'Frozen Shoulder',
        diagnosed: '2023-11-20',
        treatment: 'Manual therapy and exercises',
      },
    ],
    createdAt: '2023-11-20T14:30:00Z',
  },
  {
    id: 'pat-3',
    name: 'Amit Patel',
    phone: '9876543212',
    email: 'amit.patel@yahoo.com',
    dateOfBirth: '1978-12-05',
    gender: 'Male',
    address: 'Ghodbunder Road, Thane',
    medicalHistory: [
      {
        condition: 'Knee Pain',
        diagnosed: '2024-02-01',
        treatment: 'Strength training and ultrasound therapy',
      },
    ],
    createdAt: '2024-02-01T11:15:00Z',
  },
  {
    id: 'pat-4',
    name: 'Sneha Desai',
    phone: '9876543213',
    email: 'sneha.d@gmail.com',
    dateOfBirth: '1995-05-18',
    gender: 'Female',
    address: 'Majiwada, Thane',
    medicalHistory: [],
    createdAt: '2024-02-03T09:00:00Z',
  },
  {
    id: 'pat-5',
    name: 'Vikram Singh',
    phone: '9876543214',
    dateOfBirth: '1982-09-30',
    gender: 'Male',
    address: 'Vartak Nagar, Thane',
    medicalHistory: [
      {
        condition: 'Sports Injury - Ankle Sprain',
        diagnosed: '2024-01-25',
        treatment: 'RICE protocol and mobilization',
      },
    ],
    createdAt: '2024-01-25T16:45:00Z',
  },
  {
    id: 'pat-6',
    name: 'Anjali Kulkarni',
    phone: '9876543215',
    email: 'anjali.k@gmail.com',
    dateOfBirth: '1988-11-12',
    gender: 'Female',
    medicalHistory: [
      {
        condition: 'Cervical Spondylosis',
        diagnosed: '2023-12-15',
        treatment: 'Neck exercises and traction',
      },
    ],
    createdAt: '2023-12-15T10:30:00Z',
  },
  {
    id: 'pat-7',
    name: 'Karan Joshi',
    phone: '9876543216',
    dateOfBirth: '1992-04-08',
    gender: 'Male',
    medicalHistory: [],
    createdAt: '2024-02-04T15:00:00Z',
  },
  {
    id: 'pat-8',
    name: 'Neha Agarwal',
    phone: '9876543217',
    email: 'neha.agarwal@hotmail.com',
    dateOfBirth: '1986-08-25',
    gender: 'Female',
    address: 'Kasarvadavali, Thane',
    medicalHistory: [
      {
        condition: 'Post-surgical rehabilitation',
        diagnosed: '2024-01-05',
        treatment: 'Progressive strengthening program',
      },
    ],
    createdAt: '2024-01-05T11:00:00Z',
  },
];

export const getPatientById = (id: string): Patient | undefined => {
  return patients.find(patient => patient.id === id);
};

export const getPatientByPhone = (phone: string): Patient | undefined => {
  return patients.find(patient => patient.phone === phone);
};

export const searchPatients = (query: string): Patient[] => {
  const lowerQuery = query.toLowerCase();
  return patients.filter(
    patient =>
      patient.name.toLowerCase().includes(lowerQuery) ||
      patient.phone.includes(query)
  );
};