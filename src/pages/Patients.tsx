import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Phone, Mail, Calendar, User, Clock, X, Loader, DollarSign } from 'lucide-react';
import { Patient } from '../mocks/patients';
import { patientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';

interface PatientWithStats extends Patient {
    appointmentCount: number;
    totalCharges: number;
    pendingCharges: number;
}

const Patients: React.FC = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patients, setPatients] = useState<PatientWithStats[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [appointmentData, setAppointmentData] = useState({
        selectedDates: [] as string[],
        currentDate: '',
        appointmentTime: '',
        treatmentType: '',
        amount: '',
    });
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        gender: 'Male' as 'Male' | 'Female' | 'Other',
        address: '',
        // Optional appointment scheduling
        scheduleAppointment: false,
        selectedDates: [] as string[],
        currentDate: '',
        appointmentTime: '',
        treatmentType: '',
        amount: '',
    });

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            setLoading(true);
            setError('');
            const fetchedPatients = await patientService.getAll();
            
            // Fetch appointments for each patient
            const patientsWithStats = await Promise.all(
                (fetchedPatients as any[]).map(async (patient: Patient) => {
                    try {
                        const appointments = await appointmentService.getByPatientId(patient.id);
                        const totalCharges = appointments.reduce((sum, apt: any) => sum + (apt.amount || 0), 0);
                        const pendingCharges = appointments
                            .filter((apt: any) => !apt.isPaid)
                            .reduce((sum, apt: any) => sum + (apt.amount || 0), 0);
                        
                        return {
                            ...patient,
                            appointmentCount: appointments.length,
                            totalCharges,
                            pendingCharges,
                        } as PatientWithStats;
                    } catch (err) {
                        console.error(`Error fetching appointments for patient ${patient.id}:`, err);
                        return {
                            ...patient,
                            appointmentCount: 0,
                            totalCharges: 0,
                            pendingCharges: 0,
                        } as PatientWithStats;
                    }
                })
            );
            
            setPatients(patientsWithStats);
        } catch (err) {
            console.error('Error loading patients:', err);
            setError('Failed to load patients. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setSubmitting(true);
        setError('');

        try {
            const newPatient: Omit<Patient, 'id'> = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email || '',
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                address: formData.address || '',
                medicalHistory: [],
                createdAt: new Date().toISOString(),
            };

            // Check for duplicate (by phone number)
            const existingPatients = await patientService.searchByPhone(formData.phone);
            if (existingPatients && existingPatients.length > 0) {
                alert('A patient with this phone number already exists!');
                setSubmitting(false);
                return;
            }

            // Create patient in Firebase
            const patientId = await patientService.create(newPatient as any);

            // If appointment scheduling is enabled
            if (formData.scheduleAppointment && formData.selectedDates.length > 0 && formData.appointmentTime) {
                const userId = localStorage.getItem('userId') || '';
                const userName = localStorage.getItem('userName') || 'Doctor';
                
                // Create appointments for all selected dates
                const appointmentPromises = formData.selectedDates.map(async (date) => {
                    const appointmentData = {
                        patientId: patientId,
                        patientName: formData.name,
                        doctorId: userId,
                        doctorName: userName,
                        providerId: userId, // For compatibility with types
                        date: date,
                        time: formData.appointmentTime,
                        status: 'pending' as const,
                        treatmentType: formData.treatmentType || 'General Consultation',
                        amount: Number(formData.amount) || 0,
                        isPaid: false,
                        notes: 'Walk-in patient',
                        createdAt: new Date().toISOString(),
                    };
                    
                    return appointmentService.create(appointmentData as any);
                });
                
                await Promise.all(appointmentPromises);
                
                console.log('👤 New Patient & Appointments Created:', {
                    patientId,
                    appointmentCount: formData.selectedDates.length,
                    dates: formData.selectedDates,
                    timestamp: new Date().toISOString(),
                });
            } else {
                console.log('👤 New Patient Added:', {
                    patientId,
                    timestamp: new Date().toISOString(),
                });
            }

            // Capture values before resetting form
            const hadAppointments = formData.scheduleAppointment && formData.selectedDates.length > 0;
            const appointmentCount = formData.selectedDates.length;
            const appointmentTime = formData.appointmentTime;

            // Reset form and close modal FIRST
            setFormData({
                name: '',
                phone: '',
                email: '',
                dateOfBirth: '',
                gender: 'Male',
                address: '',
                scheduleAppointment: false,
                selectedDates: [],
                currentDate: '',
                appointmentTime: '',
                treatmentType: '',
                amount: '',
            });
            setSubmitting(false);
            setShowAddModal(false);
            
            // Reload patients list in background
            loadPatients();
            
            // Show success message after modal is closed
            setTimeout(() => {
                if (hadAppointments) {
                    alert(`Patient added successfully!\n\n${appointmentCount} appointment(s) scheduled at ${appointmentTime}`);
                } else {
                    alert('Patient added successfully!');
                }
            }, 100);
        } catch (err) {
            console.error('Error adding patient:', err);
            setError('Failed to add patient. Please try again.');
            setSubmitting(false);
            alert('Failed to add patient. Please try again.');
        }
    };

    const handleScheduleAppointment = (patient: Patient) => {
        setSelectedPatient(patient);
        setAppointmentData({
            selectedDates: [],
            currentDate: '',
            appointmentTime: '',
            treatmentType: '',
            amount: '',
        });
        setShowAppointmentModal(true);
    };

    const handleAddDate = () => {
        if (appointmentData.currentDate && !appointmentData.selectedDates.includes(appointmentData.currentDate)) {
            setAppointmentData({
                ...appointmentData,
                selectedDates: [...appointmentData.selectedDates, appointmentData.currentDate].sort(),
                currentDate: '',
            });
        }
    };

    const handleRemoveDate = (dateToRemove: string) => {
        setAppointmentData({
            ...appointmentData,
            selectedDates: appointmentData.selectedDates.filter(date => date !== dateToRemove),
        });
    };

    const handleAddDateInForm = () => {
        if (formData.currentDate && !formData.selectedDates.includes(formData.currentDate)) {
            setFormData({
                ...formData,
                selectedDates: [...formData.selectedDates, formData.currentDate].sort(),
                currentDate: '',
            });
        }
    };

    const handleRemoveDateInForm = (dateToRemove: string) => {
        setFormData({
            ...formData,
            selectedDates: formData.selectedDates.filter(date => date !== dateToRemove),
        });
    };

    const handleSaveAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedPatient || appointmentData.selectedDates.length === 0) {
            alert('Please select at least one date!');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const userId = localStorage.getItem('userId') || '';
            const userName = localStorage.getItem('userName') || 'Doctor';
            
            // Create appointments for each selected date
            const appointmentPromises = appointmentData.selectedDates.map(async (date) => {
                const newAppointmentData = {
                    patientId: selectedPatient.id,
                    patientName: selectedPatient.name,
                    doctorId: userId,
                    doctorName: userName,
                    providerId: userId, // For compatibility with types
                    date: date,
                    time: appointmentData.appointmentTime,
                    status: 'pending' as const,
                    treatmentType: appointmentData.treatmentType || 'General Consultation',
                    amount: Number(appointmentData.amount) || 0,
                    isPaid: false,
                    notes: '',
                    createdAt: new Date().toISOString(),
                };
                
                return appointmentService.create(newAppointmentData as any);
            });
            
            await Promise.all(appointmentPromises);
            
            console.log('📅 Multiple Appointments Scheduled:', {
                patient: selectedPatient,
                dates: appointmentData.selectedDates,
                count: appointmentData.selectedDates.length,
                timestamp: new Date().toISOString(),
            });

            // Close modal and reset state FIRST
            const appointmentCount = appointmentData.selectedDates.length;
            const patientName = selectedPatient.name;
            setShowAppointmentModal(false);
            setSelectedPatient(null);
            setSubmitting(false);
            
            // Show success message after modal is closed
            setTimeout(() => {
                alert(`${appointmentCount} appointment(s) scheduled for ${patientName}`);
            }, 100);
        } catch (err) {
            console.error('Error scheduling appointments:', err);
            setError('Failed to schedule appointments. Please try again.');
            setSubmitting(false);
            alert('Failed to schedule appointments. Please try again.');
        }
    };

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <main className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-primary-800 flex items-center gap-2">
                            <Users className="text-accent-500" size={28} />
                            Patients
                        </h1>
                        <p className="text-gray-600 mt-1">{patients.length} total patients</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary flex items-center gap-2"
                        disabled={loading}
                    >
                        <UserPlus size={20} />
                        Add Patient
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="card bg-red-50 border-2 border-red-200 mb-6">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Search */}
                <div className="card mb-6">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                        placeholder="Search by name, phone, or email..."
                        disabled={loading}
                    />
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <Loader className="animate-spin text-primary-600" size={48} />
                    </div>
                )}

                {/* Patient List */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPatients.map(patient => (
                        <div 
                            key={patient.id} 
                            onClick={() => handleScheduleAppointment(patient)}
                            className="card hover:shadow-lg transition-all cursor-pointer"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className="bg-accent-100 p-2 rounded-lg flex-shrink-0">
                                    <User className="text-accent-600" size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{patient.name}</h3>
                                    <p className="text-xs text-gray-500">{patient.gender} • {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Phone size={14} className="text-gray-400 flex-shrink-0" />
                                    <span>{patient.phone}</span>
                                </div>
                                {patient.email && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail size={14} className="text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{patient.email}</span>
                                    </div>
                                )}
                                {patient.address && (
                                    <p className="text-xs text-gray-500 line-clamp-2">{patient.address}</p>
                                )}
                            </div>
                            
                            {/* Appointment Stats */}
                            {patient.appointmentCount > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Calendar size={14} className="text-gray-400" />
                                            <span>{patient.appointmentCount} appointment{patient.appointmentCount > 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="flex items-center gap-1 font-semibold text-green-600">
                                            <DollarSign size={14} />
                                            <span>₹{patient.totalCharges}</span>
                                        </div>
                                    </div>
                                    {patient.pendingCharges > 0 && (
                                        <div className="mt-1 text-xs text-orange-600 font-medium">
                                            ₹{patient.pendingCharges} pending
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="w-full mt-3 bg-accent-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                                <Calendar size={16} />
                                Schedule Appointment
                            </div>
                        </div>
                    ))}
                </div>
                )}

                {!loading && filteredPatients.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No patients found
                    </div>
                )}
            </div>

            {/* Add Patient Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-4 my-4">
                        <div className="flex items-center justify-between mb-3 sticky top-0 bg-white pb-2 border-b">
                            <h3 className="text-lg font-bold text-primary-800">Add New Patient</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddPatient} className="space-y-3">
                            {/* Patient Information */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-2">
                                <p className="text-sm font-semibold text-blue-800">Patient Information</p>
                            </div>

                            {/* Name, Phone, Email in one row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input-field"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input-field"
                                        placeholder="9876543210"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input-field"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            {/* Date of Birth and Gender */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Date of Birth *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Gender *
                                    </label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                                        className="input-field"
                                        required
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Address (Optional)
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="input-field"
                                    rows={2}
                                    placeholder="Full address..."
                                />
                            </div>

                            {/* Optional Appointment Scheduling */}
                            <div className="border-t pt-3">
                                <label className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.scheduleAppointment}
                                        onChange={(e) => setFormData({ ...formData, scheduleAppointment: e.target.checked })}
                                        className="w-4 h-4 text-accent-500"
                                    />
                                    <span className="text-xs font-semibold text-gray-700">
                                        Schedule Appointment (Optional)
                                    </span>
                                </label>

                                {formData.scheduleAppointment && (
                                    <div className="bg-accent-50 border-2 border-accent-200 rounded-lg p-3 space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                <Calendar className="inline mr-1" size={12} />
                                                Select Appointment Dates *
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                                                <input
                                                    type="date"
                                                    value={formData.currentDate}
                                                    onChange={(e) => setFormData({ ...formData, currentDate: e.target.value })}
                                                    className="input-field text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddDateInForm}
                                                    style={{
                                                        backgroundColor: '#14b8a6',
                                                        color: 'white',
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        fontSize: '14px',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    <Calendar size={16} />
                                                    Add Date
                                                </button>
                                            </div>
                                            
                                            {/* Selected Dates Display */}
                                            {formData.selectedDates.length > 0 && (
                                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                                    <p className="text-xs font-semibold text-green-800 mb-1">
                                                        Selected Dates ({formData.selectedDates.length}):
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {formData.selectedDates.map(date => (
                                                            <div 
                                                                key={date} 
                                                                className="bg-white border border-green-300 rounded px-2 py-1 flex items-center gap-1.5 text-xs"
                                                            >
                                                                <span className="text-gray-700 font-medium">
                                                                    {new Date(date).toLocaleDateString('en-US', { 
                                                                        month: 'short', 
                                                                        day: 'numeric',
                                                                        year: 'numeric'
                                                                    })}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveDateInForm(date)}
                                                                    className="text-red-500 hover:text-red-700 transition-colors"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    <Clock className="inline mr-1" size={12} />
                                                    Time *
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formData.appointmentTime}
                                                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                                                    className="input-field text-sm"
                                                    required={formData.scheduleAppointment}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Treatment Type *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.treatmentType}
                                                    onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })}
                                                    className="input-field text-sm"
                                                    placeholder="General Consultation"
                                                    required={formData.scheduleAppointment}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Amount (₹) *
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                    className="input-field text-sm"
                                                    placeholder="500"
                                                    required={formData.scheduleAppointment}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 btn-secondary text-sm py-2"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-1"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader className="animate-spin" size={16} />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="inline" size={16} />
                                            {formData.scheduleAppointment && formData.selectedDates.length > 0
                                                ? `Add Patient (${formData.selectedDates.length} apt${formData.selectedDates.length > 1 ? 's' : ''})`
                                                : 'Add Patient'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Schedule Appointment Modal for Existing Patient */}
            {showAppointmentModal && selectedPatient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 my-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-primary-800">Schedule Appointment</h3>
                            <button onClick={() => setShowAppointmentModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">Patient: <span className="font-semibold text-gray-900">{selectedPatient.name}</span></p>
                            <p className="text-sm text-gray-600">Phone: <span className="font-semibold text-gray-900">{selectedPatient.phone}</span></p>
                        </div>

                        <form onSubmit={handleSaveAppointment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="inline mr-1" size={14} />
                                    Select Appointment Dates *
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                                    <input
                                        type="date"
                                        value={appointmentData.currentDate}
                                        onChange={(e) => setAppointmentData({ ...appointmentData, currentDate: e.target.value })}
                                        className="input-field"
                                        placeholder="Select a date"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddDate}
                                        style={{
                                            backgroundColor: '#14b8a6',
                                            color: 'white',
                                            padding: '12px 24px',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            fontSize: '16px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <Calendar size={18} />
                                        Add Date
                                    </button>
                                </div>
                                
                                {/* Selected Dates Display */}
                                {appointmentData.selectedDates.length > 0 && (
                                    <div className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                                        <p className="text-sm font-semibold text-green-800 mb-2">
                                            Selected Dates ({appointmentData.selectedDates.length}):
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {appointmentData.selectedDates.map(date => (
                                                <div 
                                                    key={date} 
                                                    className="bg-white border border-green-300 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm"
                                                >
                                                    <span className="text-gray-700 font-medium">
                                                        {new Date(date).toLocaleDateString('en-US', { 
                                                            month: 'short', 
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveDate(date)}
                                                        className="text-red-500 hover:text-red-700 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Clock className="inline mr-1" size={14} />
                                    Appointment Time *
                                </label>
                                <input
                                    type="time"
                                    value={appointmentData.appointmentTime}
                                    onChange={(e) => setAppointmentData({ ...appointmentData, appointmentTime: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Treatment Type *
                                </label>
                                <input
                                    type="text"
                                    value={appointmentData.treatmentType}
                                    onChange={(e) => setAppointmentData({ ...appointmentData, treatmentType: e.target.value })}
                                    className="input-field"
                                    placeholder="General Consultation"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    value={appointmentData.amount}
                                    onChange={(e) => setAppointmentData({ ...appointmentData, amount: e.target.value })}
                                    className="input-field"
                                    placeholder="500"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAppointmentModal(false)}
                                    className="flex-1 btn-secondary"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader className="animate-spin" size={18} />
                                            Scheduling...
                                        </>
                                    ) : (
                                        <>
                                            <Calendar size={18} />
                                            {appointmentData.selectedDates.length > 1 
                                                ? `Schedule (${appointmentData.selectedDates.length} appointments)` 
                                                : 'Schedule'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Patients;
