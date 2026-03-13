import React, { useState, useEffect } from 'react';
import { useScheduling } from '../../hooks/useScheduling';
import ScheduleCalendar from './ScheduleCalendar';
import { checkPackageAvailability } from '../../services/packageService';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';
import type { TreatmentPackage } from '../../types';

const AppointmentScheduler: React.FC = () => {
    const { patients, fetchPatients, scheduleAppointment } = useScheduling();
    const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [treatmentType, setTreatmentType] = useState<string>('');
    const [activePackage, setActivePackage] = useState<TreatmentPackage | null>(null);
    const [checkingPackage, setCheckingPackage] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    // Check for active package when patient and treatment type are selected
    useEffect(() => {
        const checkForPackage = async () => {
            if (selectedPatient && treatmentType) {
                setCheckingPackage(true);
                try {
                    const pkg = await checkPackageAvailability(selectedPatient, treatmentType);
                    setActivePackage(pkg);
                } catch (error) {
                    console.error('Error checking package:', error);
                    setActivePackage(null);
                } finally {
                    setCheckingPackage(false);
                }
            } else {
                setActivePackage(null);
            }
        };

        checkForPackage();
    }, [selectedPatient, treatmentType]);

    const handleSchedule = () => {
        if (selectedPatient && selectedDate && selectedTime) {
            // TODO: Pass package information to scheduling function if available
            scheduleAppointment(selectedPatient, selectedDate, selectedTime);
            // Reset selections after scheduling
            setSelectedPatient(null);
            setSelectedDate(null);
            setSelectedTime(null);
            setTreatmentType('');
            setActivePackage(null);
        }
    };

    const selectedPatientData = patients.find(p => p.id === selectedPatient);

    return (
        <div className="appointment-scheduler max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Schedule an Appointment</h2>
            
            {/* Patient Selection */}
            <div className="mb-4">
                <label htmlFor="patient-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient <span className="text-red-500">*</span>
                </label>
                <select
                    id="patient-select"
                    value={selectedPatient || ''}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="input-field"
                >
                    <option value="" disabled>Select a patient</option>
                    {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                            {patient.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Treatment Type */}
            <div className="mb-4">
                <label htmlFor="treatment-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Treatment Type <span className="text-red-500">*</span>
                </label>
                <input
                    id="treatment-type"
                    type="text"
                    value={treatmentType}
                    onChange={(e) => setTreatmentType(e.target.value)}
                    placeholder="e.g., Physiotherapy, Back Pain Treatment"
                    className="input-field"
                />
            </div>

            {/* Package Status Display */}
            {checkingPackage && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">Checking for active packages...</p>
                </div>
            )}

            {activePackage && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Package className="text-green-600 flex-shrink-0 mt-1" size={24} />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="text-green-600" size={18} />
                                <h3 className="font-semibold text-green-800">Active Package Found</h3>
                            </div>
                            <div className="space-y-1 text-sm text-green-800">
                                <p><span className="font-medium">Package:</span> {activePackage.packageName}</p>
                                <p><span className="font-medium">Sessions Remaining:</span> {activePackage.remainingSessions} of {activePackage.totalSessions}</p>
                                <p><span className="font-medium">Status:</span> Pre-paid (No payment required)</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!checkingPackage && !activePackage && selectedPatient && treatmentType && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={18} />
                        <div>
                            <p className="text-sm text-yellow-800">
                                No active package found for this treatment type. This will be a single appointment requiring payment.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Calendar */}
            <ScheduleCalendar
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setSelectedTime={setSelectedTime}
            />

            {/* Schedule Button */}
            <button 
                onClick={handleSchedule} 
                disabled={!selectedPatient || !selectedDate || !selectedTime || !treatmentType}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors mt-6"
            >
                {activePackage ? 'Schedule Package Session' : 'Schedule Appointment'}
            </button>

            {selectedDate && selectedTime && selectedPatientData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                    <p className="font-semibold mb-2">Appointment Summary:</p>
                    <p>Patient: {selectedPatientData.name}</p>
                    <p>Date: {selectedDate.toLocaleDateString()}</p>
                    <p>Time: {selectedTime}</p>
                    <p>Treatment: {treatmentType}</p>
                    {activePackage && (
                        <p className="text-green-700 font-semibold mt-2">
                            ✓ This appointment will use 1 session from the active package
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default AppointmentScheduler;