import React, { useState, useEffect } from 'react';
import { useScheduling } from '../../hooks/useScheduling';
import ScheduleCalendar from './ScheduleCalendar';

const AppointmentScheduler: React.FC = () => {
    const { patients, fetchPatients, scheduleAppointment } = useScheduling();
    const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const handleSchedule = () => {
        if (selectedPatient && selectedDate && selectedTime) {
            scheduleAppointment(selectedPatient, selectedDate, selectedTime);
            // Reset selections after scheduling
            setSelectedPatient(null);
            setSelectedDate(null);
            setSelectedTime(null);
        }
    };

    return (
        <div className="appointment-scheduler">
            <h2>Schedule an Appointment</h2>
            <div>
                <label htmlFor="patient-select">Select Patient:</label>
                <select
                    id="patient-select"
                    value={selectedPatient || ''}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                >
                    <option value="" disabled>Select a patient</option>
                    {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                            {patient.name}
                        </option>
                    ))}
                </select>
            </div>
            <ScheduleCalendar
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setSelectedTime={setSelectedTime}
            />
            <button onClick={handleSchedule} disabled={!selectedPatient || !selectedDate || !selectedTime}>
                Schedule Appointment
            </button>
        </div>
    );
};

export default AppointmentScheduler;