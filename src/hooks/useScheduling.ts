import { useState, useEffect } from 'react';
import { Appointment } from '../types';

const useScheduling = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const response = await fetch('/api/appointments');
                if (!response.ok) {
                    throw new Error('Failed to fetch appointments');
                }
                const data = await response.json();
                setAppointments(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const scheduleAppointment = async (newAppointment: Appointment) => {
        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newAppointment),
            });
            if (!response.ok) {
                throw new Error('Failed to schedule appointment');
            }
            const data = await response.json();
            setAppointments((prev) => [...prev, data]);
        } catch (err) {
            setError(err.message);
        }
    };

    return { appointments, loading, error, scheduleAppointment };
};

export { useScheduling };
export const useAppointments = useScheduling;
export default useScheduling;