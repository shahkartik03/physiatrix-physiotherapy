export interface Doctor {
  id: string;
  name: string;
  email: string;
  password: string;
  specialty: string;
  phone: string;
  commissionRate: number; // percentage
  workingHours: WorkingHours[];
  isAdmin: boolean;
}

export interface WorkingHours {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "17:00"
  slotDuration: number; // in minutes, e.g., 30
}

export const doctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sangna Sheth',
    email: 'sangna@physiatrix.com',
    password: 'admin123',
    specialty: 'Physiotherapy (MPT, MIAP)',
    phone: '083696 68284',
    commissionRate: 0, // Admin doctor - no commission
    isAdmin: true,
    workingHours: [
      { day: 'Monday', startTime: '09:00', endTime: '18:00', slotDuration: 30 },
      { day: 'Tuesday', startTime: '09:00', endTime: '18:00', slotDuration: 30 },
      { day: 'Wednesday', startTime: '09:00', endTime: '18:00', slotDuration: 30 },
      { day: 'Thursday', startTime: '09:00', endTime: '18:00', slotDuration: 30 },
      { day: 'Friday', startTime: '09:00', endTime: '18:00', slotDuration: 30 },
      { day: 'Saturday', startTime: '10:00', endTime: '14:00', slotDuration: 30 },
    ],
  },
  {
    id: 'doc-2',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh@physiatrix.com',
    password: 'doctor123',
    specialty: 'Sports Physiotherapy',
    phone: '098765 43210',
    commissionRate: 20, // 20% commission
    isAdmin: false,
    workingHours: [
      { day: 'Monday', startTime: '10:00', endTime: '16:00', slotDuration: 30 },
      { day: 'Wednesday', startTime: '10:00', endTime: '16:00', slotDuration: 30 },
      { day: 'Friday', startTime: '10:00', endTime: '16:00', slotDuration: 30 },
    ],
  },
  {
    id: 'doc-3',
    name: 'Dr. Priya Patel',
    email: 'priya@physiatrix.com',
    password: 'doctor123',
    specialty: 'Orthopedic Physiotherapy',
    phone: '098765 43211',
    commissionRate: 15, // 15% commission
    isAdmin: false,
    workingHours: [
      { day: 'Tuesday', startTime: '09:00', endTime: '17:00', slotDuration: 30 },
      { day: 'Thursday', startTime: '09:00', endTime: '17:00', slotDuration: 30 },
      { day: 'Saturday', startTime: '09:00', endTime: '13:00', slotDuration: 30 },
    ],
  },
  {
    id: 'doc-4',
    name: 'Dr. Amit Shah',
    email: 'amit@physiatrix.com',
    password: 'doctor123',
    specialty: 'Neurological Physiotherapy',
    phone: '098765 43212',
    commissionRate: 18, // 18% commission
    isAdmin: false,
    workingHours: [
      { day: 'Monday', startTime: '14:00', endTime: '20:00', slotDuration: 45 },
      { day: 'Wednesday', startTime: '14:00', endTime: '20:00', slotDuration: 45 },
      { day: 'Friday', startTime: '14:00', endTime: '20:00', slotDuration: 45 },
    ],
  },
];

export const getDoctorById = (id: string): Doctor | undefined => {
  return doctors.find(doc => doc.id === id);
};

export const getDoctorByEmail = (email: string): Doctor | undefined => {
  return doctors.find(doc => doc.email === email);
};

export const getAvailableDoctors = (day: string): Doctor[] => {
  return doctors.filter(doc => 
    doc.workingHours.some(wh => wh.day === day)
  );
};