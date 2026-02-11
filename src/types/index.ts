export type Appointment = {
  id: string;
  patientId: string;
  providerId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'canceled';
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