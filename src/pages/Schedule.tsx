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
    const [filterView, setFilterView] = useState<'upcoming' | 'past-issues' | 'all'>('upcoming');
    const [doctorAppointments, setDoctorAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAppointments();
    }, [userId, userRole, filterView]);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            setError('');
            const isAdmin = userRole === 'admin';
            
            let appointments;
            const today = new Date().toISOString().split('T')[0];
            
            if (filterView === 'upcoming') {
                // Show today and future appointments
                const allAppointments = await appointmentService.getAll(userId, isAdmin);
                appointments = allAppointments.filter((apt: any) => apt.date >= today);
            } else if (filterView === 'past-unclosed') {
                // Show past scheduled appointments and no-shows
                appointments = await appointmentService.getPastIssues(userId, isAdmin);
            } else {
                // Show all appointments
                appointments = await appointmentService.getAll(userId, isAdmin);
            }
            
            setDoctorAppointments(appointments as any);
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
        <main className="h-screen flex flex-col bg-gray-50 pb-24 md:pb-8">
            <div className="w-full max-w-full px-4 py-4 flex flex-col h-full overflow-hidden">
                <div className="mb-3 flex-shrink-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary-800">Schedule View</h1>
                    <p className="text-gray-600 mt-1">{userRole === 'admin' ? 'All appointments across doctors' : 'Your appointments'}</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="card bg-red-50 border-2 border-red-200 mb-4 flex-shrink-0">
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 flex-shrink-0">
                    {/* View Filter - Always shown */}
                    <div className="card p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Filter size={16} className="text-gray-600" />
                            <span className="font-semibold text-gray-700 text-sm">View</span>
                        </div>
                        <select
                            value={filterView}
                            onChange={(e) => setFilterView(e.target.value as any)}
                            className="input-field"
                        >
                            <option value="upcoming">Today & Upcoming</option>
                            <option value="past-unclosed">Past Issues & No-Shows</option>
                            <option value="all">All Appointments</option>
                        </select>
                    </div>
                    {userRole === 'admin' && (
                        <div className="card p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                                <User size={16} className="text-gray-600" />
                                <span className="font-semibold text-gray-700 text-sm">Filter by Doctor</span>
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
                    <div className="card p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                        <Filter size={16} className="text-gray-600" />
                        <span className="font-semibold text-gray-700 text-sm">Date</span>
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

                {/* Alert for Past Issues View */}
                {filterView === 'past-unclosed' && doctorAppointments.length > 0 && (
                    <div className="card bg-red-50 border-2 border-red-200 mb-4 p-3 flex-shrink-0">
                        <p className="text-xs text-red-800">
                            <strong>⚠️ Past Issues:</strong> Showing past appointments that are unclosed (scheduled) and no-shows. Go to Dashboard to take action on unclosed appointments.
                        </p>
                    </div>
                )}

                {/* Scrollable Appointments Section */}
                <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                {finalSortedDates
                    .filter(date => filterDate === 'all' || date === filterDate)
                    .map(date => (
                        <div key={date} className="mb-3">
                            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-gray-50 py-1 z-10">
                                <Calendar size={16} className="text-primary-600" />
                                <h2 className="text-sm font-bold text-primary-800">
                                    {new Date(date).toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        month: 'short', 
                                        day: 'numeric' 
                                    })}
                                </h2>
                            </div>
                            <div className="grid gap-3 w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 280px))' }}>
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
                </div>
                </>
                )}
            </div>
        </main>
    );
};

export default Schedule;