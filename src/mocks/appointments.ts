export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  phone?: string; // Patient phone number for reminders
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'pending' | 'completed' | 'cancelled' | 'no-show' | 'scheduled';
  treatmentType: string;
  amount: number;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
  
  // Reminder tracking fields
  reminderSent?: boolean;
  reminderSentAt?: string; // ISO timestamp
  reminderSentBy?: string; // userId who sent it
  reminderSentByName?: string; // userName who sent it
  reminderMethod?: 'whatsapp' | 'sms' | 'call'; // Method used for reminder
  
  // Package session fields (existing)
  isPrePaid?: boolean;
  packageId?: string;
  isPackageSession?: boolean;
  sessionNumber?: number;
  paymentMode?: 'cash' | 'upi';
}

export const appointments: Appointment[] = [
  // Today's appointments (Feb 5, 2026)
  {
    id: 'apt-1',
    patientId: 'pat-1',
    patientName: 'Rajesh Sharma',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sangna Sheth',
    date: '2026-02-05',
    time: '10:00',
    status: 'completed',
    treatmentType: 'Lower Back Pain Treatment',
    amount: 800,
    isPaid: true,
    notes: 'Regular follow-up session',
    createdAt: '2026-02-04T15:30:00Z',
  },
  {
    id: 'apt-2',
    patientId: 'pat-2',
    patientName: 'Priya Mehta',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sangna Sheth',
    date: '2026-02-05',
    time: '11:30',
    status: 'completed',
    treatmentType: 'Frozen Shoulder Therapy',
    amount: 900,
    isPaid: true,
    notes: 'Significant improvement observed',
    createdAt: '2026-02-03T10:00:00Z',
  },
  {
    id: 'apt-3',
    patientId: 'pat-3',
    patientName: 'Amit Patel',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sangna Sheth',
    date: '2026-02-05',
    time: '14:00',
    status: 'pending',
    treatmentType: 'Knee Pain Treatment',
    amount: 750,
    isPaid: false,
    createdAt: '2026-02-04T12:00:00Z',
  },
  {
    id: 'apt-4',
    patientId: 'pat-4',
    patientName: 'Sneha Desai',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sangna Sheth',
    date: '2026-02-05',
    time: '15:30',
    status: 'pending',
    treatmentType: 'Initial Consultation',
    amount: 600,
    isPaid: false,
    createdAt: '2026-02-03T14:20:00Z',
  },
  {
    id: 'apt-5',
    patientId: 'pat-5',
    patientName: 'Vikram Singh',
    doctorId: 'doc-2',
    doctorName: 'Dr. Rajesh Kumar',
    date: '2026-02-05',
    time: '10:00',
    status: 'completed',
    treatmentType: 'Sports Injury Rehabilitation',
    amount: 1000,
    isPaid: true,
    notes: 'Ankle sprain recovery on track',
    createdAt: '2026-02-04T09:00:00Z',
  },
  // Upcoming appointments
  {
    id: 'apt-6',
    patientId: 'pat-6',
    patientName: 'Anjali Kulkarni',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sangna Sheth',
    date: '2026-02-06',
    time: '09:30',
    status: 'pending',
    treatmentType: 'Cervical Spondylosis Treatment',
    amount: 850,
    isPaid: false,
    createdAt: '2026-02-04T16:00:00Z',
  },
  {
    id: 'apt-7',
    patientId: 'pat-7',
    patientName: 'Karan Joshi',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sangna Sheth',
    date: '2026-02-06',
    time: '11:00',
    status: 'pending',
    treatmentType: 'Initial Consultation',
    amount: 600,
    isPaid: false,
    createdAt: '2026-02-04T18:30:00Z',
  },
  {
    id: 'apt-8',
    patientId: 'pat-8',
    patientName: 'Neha Agarwal',
    doctorId: 'doc-3',
    doctorName: 'Dr. Priya Patel',
    date: '2026-02-06',
    time: '10:00',
    status: 'pending',
    treatmentType: 'Post-surgical Rehabilitation',
    amount: 1200,
    isPaid: false,
    createdAt: '2026-02-05T08:00:00Z',
  },
  {
    id: 'apt-9',
    patientId: 'pat-1',
    patientName: 'Rajesh Sharma',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sangna Sheth',
    date: '2026-02-07',
    time: '10:00',
    status: 'pending',
    treatmentType: 'Lower Back Pain Treatment',
    amount: 800,
    isPaid: false,
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'apt-10',
    patientId: 'pat-2',
    patientName: 'Priya Mehta',
    doctorId: 'doc-2',
    doctorName: 'Dr. Rajesh Kumar',
    date: '2026-02-07',
    time: '14:00',
    status: 'pending',
    treatmentType: 'Follow-up Session',
    amount: 700,
    isPaid: false,
    createdAt: '2026-02-05T11:30:00Z',
  },
  // Today's appointments for Admin (Feb 9, 2026)
  {
    id: 'apt-11',
    patientId: 'pat-9',
    patientName: 'Ravi Kapoor',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sangna Sheth',
    date: '2026-02-09',
    time: '09:00',
    status: 'completed',
    treatmentType: 'Back Pain Treatment',
    amount: 750,
    isPaid: true,
    createdAt: '2026-02-08T10:00:00Z',
  },
  {
    id: 'apt-12',
    patientId: 'pat-10',
    patientName: 'Meera Shah',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sangna Sheth',
    date: '2026-02-09',
    time: '10:30',
    status: 'pending',
    treatmentType: 'Neck Pain Treatment',
    amount: 800,
    isPaid: false,
    createdAt: '2026-02-08T12:00:00Z',
  },
  {
    id: 'apt-13',
    patientId: 'pat-11',
    patientName: 'Suresh Reddy',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sangna Sheth',
    date: '2026-02-09',
    time: '12:00',
    status: 'pending',
    treatmentType: 'Shoulder Pain Treatment',
    amount: 900,
    isPaid: false,
    createdAt: '2026-02-08T14:00:00Z',
  },
  {
    id: 'apt-14',
    patientId: 'pat-12',
    patientName: 'Kavita Iyer',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sangna Sheth',
    date: '2026-02-09',
    time: '14:00',
    status: 'pending',
    treatmentType: 'Knee Pain Treatment',
    amount: 850,
    isPaid: false,
    createdAt: '2026-02-08T15:30:00Z',
  },
  {
    id: 'apt-15',
    patientId: 'pat-13',
    patientName: 'Arun Kumar',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sangna Sheth',
    date: '2026-02-09',
    time: '15:30',
    status: 'pending',
    treatmentType: 'Initial Consultation',
    amount: 600,
    isPaid: false,
    createdAt: '2026-02-08T16:00:00Z',
  },
  {
    id: 'apt-16',
    patientId: 'pat-14',
    patientName: 'Pooja Malhotra',
    doctorId: 'doc-2',
    doctorName: 'Dr. Rajesh Kumar',
    date: '2026-02-09',
    time: '10:00',
    status: 'completed',
    treatmentType: 'Sports Injury',
    amount: 1100,
    isPaid: true,
    createdAt: '2026-02-08T11:00:00Z',
  },
  {
    id: 'apt-17',
    patientId: 'pat-15',
    patientName: 'Rohit Verma',
    doctorId: 'doc-2',
    doctorName: 'Dr. Rajesh Kumar',
    date: '2026-02-09',
    time: '12:00',
    status: 'pending',
    treatmentType: 'Muscle Strain',
    amount: 950,
    isPaid: false,
    createdAt: '2026-02-08T13:00:00Z',
  },
  {
    id: 'apt-18',
    patientId: 'pat-16',
    patientName: 'Deepa Nair',
    doctorId: 'doc-3',
    doctorName: 'Dr. Priya Patel',
    date: '2026-02-09',
    time: '11:00',
    status: 'pending',
    treatmentType: 'Post-Surgery Rehab',
    amount: 1300,
    isPaid: false,
    createdAt: '2026-02-08T14:30:00Z',
  },
  // More upcoming appointments
  {
    id: 'apt-19',
    patientId: 'pat-1',
    patientName: 'Rajesh Sharma',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sangna Sheth',
    date: '2026-02-10',
    time: '09:00',
    status: 'pending',
    treatmentType: 'Follow-up',
    amount: 700,
    isPaid: false,
    createdAt: '2026-02-09T10:00:00Z',
  },
  {
    id: 'apt-20',
    patientId: 'pat-5',
    patientName: 'Vikram Singh',
    doctorId: 'doc-2',
    doctorName: 'Dr. Rajesh Kumar',
    date: '2026-02-10',
    time: '10:30',
    status: 'pending',
    treatmentType: 'Rehab Session',
    amount: 1000,
    isPaid: false,
    createdAt: '2026-02-09T11:00:00Z',
  },
  {
    id: 'apt-21',
    patientId: 'pat-8',
    patientName: 'Neha Agarwal',
    doctorId: 'doc-3',
    doctorName: 'Dr. Priya Patel',
    date: '2026-02-11',
    time: '14:00',
    status: 'pending',
    treatmentType: 'Physical Therapy',
    amount: 1200,
    isPaid: false,
    createdAt: '2026-02-09T12:00:00Z',
  },
];

export const getAppointmentsByDoctorId = (doctorId: string): Appointment[] => {
  const storedAppointments = localStorage.getItem('appointments');
  const allAppointments = storedAppointments ? JSON.parse(storedAppointments) : appointments;
  return allAppointments.filter((apt: Appointment) => apt.doctorId === doctorId);
};

export const getAppointmentsByDate = (date: string): Appointment[] => {
  const storedAppointments = localStorage.getItem('appointments');
  const allAppointments = storedAppointments ? JSON.parse(storedAppointments) : appointments;
  return allAppointments.filter((apt: Appointment) => apt.date === date);
};

export const getTodayAppointments = (doctorId: string, isAdmin: boolean = false): Appointment[] => {
  // Demo date - change this to test different dates
  const today = '2026-02-09';
  const storedAppointments = localStorage.getItem('appointments');
  const allAppointments = storedAppointments ? JSON.parse(storedAppointments) : appointments;
  
  if (isAdmin) {
    return allAppointments.filter((apt: Appointment) => apt.date === today);
  }
  
  return allAppointments.filter(
    (apt: Appointment) => apt.doctorId === doctorId && apt.date === today
  );
};

export const getUpcomingAppointments = (doctorId: string, isAdmin: boolean = false): Appointment[] => {
  // Demo date - change this to test different dates
  const today = '2026-02-09';
  const storedAppointments = localStorage.getItem('appointments');
  const allAppointments = storedAppointments ? JSON.parse(storedAppointments) : appointments;
  
  if (isAdmin) {
    return allAppointments.filter((apt: Appointment) => apt.date > today).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
  }
  
  return allAppointments.filter(
    (apt: Appointment) => apt.doctorId === doctorId && apt.date > today
  ).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
};

export const markAsPaid = (appointmentId: string): void => {
  const storedAppointments = localStorage.getItem('appointments');
  const allAppointments = storedAppointments ? JSON.parse(storedAppointments) : [...appointments];
  
  const appointment = allAppointments.find((apt: Appointment) => apt.id === appointmentId);
  if (appointment) {
    appointment.isPaid = true;
    appointment.status = 'completed';
    localStorage.setItem('appointments', JSON.stringify(allAppointments));
    console.log('💰 Payment Event: Appointment marked as paid', {
      appointmentId,
      patientName: appointment.patientName,
      amount: appointment.amount,
      timestamp: new Date().toISOString(),
    });
  }
};