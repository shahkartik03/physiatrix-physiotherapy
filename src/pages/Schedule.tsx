import React, { useState, useEffect } from 'react';
import { Calendar, User, Filter, Loader } from 'lucide-react';
import { Appointment } from '../mocks/appointments';
import AppointmentCard from '../components/common/AppointmentCard';
import { appointmentService } from '../services/appointmentService';

const Schedule: React.FC = () => {
    const userId = localStorage.getItem('userId') || '';
    const userRole = localStorage.getItem('userRole') || 'doctor';
    const [filterDate, setFilterDate] = useState<string>('all');
    const [filterDoctor, setFilterDoctor] = useState<string>('all');
    const [doctorAppointments, setDoctorAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAppointments();
    }, [userId, userRole]);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            setError('');
            const isAdmin = userRole === 'admin';
            
            const appointments = await appointmentService.getAll(userId, isAdmin);
            
            // Filter to only show today and future appointments
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const todayAndFuture = appointments.filter((apt: any) => apt.date >= today);
            
            setDoctorAppointments(todayAndFuture);
        } catch (err: any) {
            console.error('Error loading appointments:', err);
            // Only show error if it's a real Firebase/network error, not just empty data
            if (err?.code || err?.message?.includes('permission') || err?.message?.includes('index')) {
                setError('Failed to load appointments. Please refresh the page.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Group by date
    const groupedAppointments = doctorAppointments.reduce((acc, apt) => {
        if (!acc[apt.date]) {
            acc[apt.date] = [];
        }
        acc[apt.date].push(apt);
        return acc;
    }, {} as Record<string, typeof appointments>);

    const sortedDates = Object.keys(groupedAppointments).sort();

    // Get unique doctors for filter (admin only)
    const uniqueDoctors = userRole === 'admin' 
        ? Array.from(new Set(doctorAppointments.map(apt => apt.doctorName))).sort()
        : [];

    // Apply doctor filter
    const filteredByDoctor = filterDoctor === 'all' 
        ? doctorAppointments 
        : doctorAppointments.filter(apt => apt.doctorName === filterDoctor);

    // Regroup after doctor filter
    const finalGrouped = filteredByDoctor.reduce((acc, apt) => {
        if (!acc[apt.date]) {
            acc[apt.date] = [];
        }
        acc[apt.date].push(apt);
        return acc;
    }, {} as Record<string, typeof appointments>);

    const finalSortedDates = Object.keys(finalGrouped).sort();

    return (
        <main className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <div className="container mx-auto px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary-800">Schedule View</h1>
                    <p className="text-gray-600 mt-1">{userRole === 'admin' ? 'All appointments across doctors' : 'Your appointments'}</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="card bg-red-50 border-2 border-red-200 mb-6">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <Loader className="animate-spin text-primary-600" size={48} />
                    </div>
                )}

                {/* Filters */}
                {!loading && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {userRole === 'admin' && (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-2">
                                <User size={20} className="text-gray-600" />
                                <span className="font-semibold text-gray-700">Filter by Doctor</span>
                            </div>
                            <select
                                value={filterDoctor}
                                onChange={(e) => setFilterDoctor(e.target.value)}
                                className="input-field"
                            >
                                <option value="all">All Doctors</option>
                                {uniqueDoctors.map(doctor => (
                                    <option key={doctor} value={doctor}>{doctor}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="card">
                    <div className="flex items-center gap-2 mb-2">
                        <Filter size={20} className="text-gray-600" />
                        <span className="font-semibold text-gray-700">Filter by Date</span>
                    </div>
                    <select
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="input-field"
                            >
                                <option value="all">All Dates</option>
                                {finalSortedDates.map(date => (
                                    <option key={date} value={date}>
                                        {new Date(date).toLocaleDateString('en-US', { 
                                            weekday: 'short', 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                {/* Appointments by Date */}
                {finalSortedDates
                    .filter(date => filterDate === 'all' || date === filterDate)
                    .map(date => (
                        <div key={date} className="mb-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar size={18} className="text-primary-600" />
                                <h2 className="text-base font-bold text-primary-800">
                                    {new Date(date).toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        month: 'short', 
                                        day: 'numeric' 
                                    })}
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {finalGrouped[date]
                                    .sort((a, b) => a.time.localeCompare(b.time))
                                    .map(appointment => (
                                        <AppointmentCard
                                            key={appointment.id}
                                            appointment={appointment}
                                            variant="compact"
                                            showDoctor={userRole === 'admin'}
                                            showAction={false}
                                        />
                                    ))}
                            </div>
                        </div>
                    ))
                }

                {!loading && doctorAppointments.length === 0 && (
                    <div className="card text-center py-12">
                        <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
                        <p className="text-gray-500">No appointments scheduled</p>
                    </div>
                )}
                </>
                )}
            </div>
        </main>
    );
};

export default Schedule;