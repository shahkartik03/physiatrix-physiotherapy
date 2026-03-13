import React, { useState, useEffect } from 'react';
import { History, Loader, Calendar, User, DollarSign, FileText } from 'lucide-react';
import { Appointment } from '../types';
import { appointmentService } from '../services/appointmentService';

const AppointmentHistory: React.FC = () => {
    const userId = localStorage.getItem('userId') || '';
    const userName = localStorage.getItem('userName') || 'Doctor';
    const userRole = localStorage.getItem('userRole') || 'doctor';
    const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('all');

    useEffect(() => {
        loadCompletedAppointments();
    }, []);

    const loadCompletedAppointments = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Fetch completed appointments - non-admin view filters by doctorId
            const isAdminView = false;
            const appointments = await appointmentService.getByStatus('completed', userId, isAdminView);
            
            console.log('📋 Completed Appointments Loaded:', {
                count: appointments.length,
                userId,
                userName,
                appointments: appointments.map(apt => ({
                    id: apt.id,
                    patient: apt.patientName,
                    date: apt.date,
                    doctorId: apt.doctorId,
                    status: apt.status,
                    amount: apt.amount
                }))
            });
            
            setCompletedAppointments(appointments);
        } catch (err) {
            console.error('Error loading completed appointments:', err);
            setError('Failed to load appointment history. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    // Filter appointments based on search term and selected month
    const filteredAppointments = completedAppointments.filter(appointment => {
        const matchesSearch = 
            appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.treatmentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;
        
        if (selectedMonth === 'all') return true;
        
        const appointmentDate = new Date(appointment.date);
        const appointmentMonth = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, '0')}`;
        return appointmentMonth === selectedMonth;
    });

    console.log('🔍 Filtered Appointments:', {
        total: completedAppointments.length,
        filtered: filteredAppointments.length,
        searchTerm,
        selectedMonth,
        removedBySearch: searchTerm ? completedAppointments.length - completedAppointments.filter(apt => 
            apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.treatmentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.notes?.toLowerCase().includes(searchTerm.toLowerCase())
        ).length : 0,
        removedByMonth: selectedMonth !== 'all' ? completedAppointments.length - filteredAppointments.length : 0
    });

    // Get unique months from appointments for filter
    const availableMonths = Array.from(new Set(
        completedAppointments.map(apt => {
            const date = new Date(apt.date);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        })
    )).sort().reverse();

    // Calculate stats
    const totalEarnings = filteredAppointments.reduce((sum, apt) => sum + (apt.amount || 0), 0);
    const uniquePatients = new Set(filteredAppointments.map(apt => apt.patientId)).size;

    return (
        <main className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary-800 flex items-center gap-2">
                        <History size={28} className="text-accent-500" />
                        Appointment History
                    </h1>
                    <p className="text-gray-600 mt-1">View all your completed treatments</p>
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

                {/* Content */}
                {!loading && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-600 mb-1">Total Appointments</p>
                                <p className="text-3xl font-bold text-gray-900 leading-none my-2">
                                    {filteredAppointments.length}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Completed</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-600 mb-1">Unique Patients</p>
                                <p className="text-3xl font-bold text-gray-900 leading-none my-2">
                                    {uniquePatients}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Treated</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-600 mb-1">Total Earnings</p>
                                <p className="text-2xl font-bold text-green-600 leading-none my-2">
                                    ₹{totalEarnings.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Revenue</p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search Patients or Treatments
                                    </label>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by patient name, treatment..."
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Filter by Month
                                    </label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="all">All Months</option>
                                        {availableMonths.map(month => {
                                            const date = new Date(month + '-01');
                                            const monthName = date.toLocaleDateString('en-US', { 
                                                month: 'long', 
                                                year: 'numeric' 
                                            });
                                            return (
                                                <option key={month} value={month}>
                                                    {monthName}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Appointments Table */}
                        {filteredAppointments.length > 0 ? (
                            <>
                                {/* Show filter info if appointments are being filtered */}
                                {(searchTerm || selectedMonth !== 'all') && filteredAppointments.length < completedAppointments.length && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                        <p className="text-sm text-blue-800">
                                            <strong>Showing {filteredAppointments.length} of {completedAppointments.length} appointments</strong>
                                            {searchTerm && ` - Filtered by search: "${searchTerm}"`}
                                            {selectedMonth !== 'all' && ` - Filtered by month`}
                                        </p>
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setSelectedMonth('all');
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                )}
                                
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-primary-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                                                    Date
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                                                    Patient
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                                                    Treatment
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                                                    Time
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                                                    Payment
                                                </th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                                                    Amount
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                                                    Notes
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAppointments.map((appointment, index) => (
                                                <tr 
                                                    key={appointment.id} 
                                                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                                                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                    }`}
                                                >
                                                    <td className="py-3 px-4 text-sm text-gray-700">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} className="text-gray-400" />
                                                            {new Date(appointment.date).toLocaleDateString('en-US', { 
                                                                month: 'short', 
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                                                        <div className="flex items-center gap-2">
                                                            <User size={14} className="text-gray-400" />
                                                            {appointment.patientName}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {appointment.treatmentType}
                                                        {appointment.isPackageSession && (
                                                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                                Session {appointment.sessionNumber}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-700">
                                                        {appointment.time}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                                            appointment.paymentMode === 'cash' 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            <DollarSign size={12} />
                                                            {appointment.paymentMode?.toUpperCase() || 'CASH'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm font-bold text-gray-900 text-right">
                                                        ₹{appointment.amount?.toLocaleString() || 0}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                                                        {appointment.notes ? (
                                                            <div className="flex items-start gap-1 text-xs">
                                                                <FileText size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                                <span className="line-clamp-2">{appointment.notes}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            </>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                                <History size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg font-medium">No completed appointments found</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    {completedAppointments.length > 0 ? (
                                        <>
                                            <strong>{completedAppointments.length} total appointments are hidden by your current filters.</strong>
                                            <button
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setSelectedMonth('all');
                                                }}
                                                className="block mx-auto mt-2 text-blue-600 hover:text-blue-800 underline"
                                            >
                                                Clear all filters to view them
                                            </button>
                                        </>
                                    ) : searchTerm || selectedMonth !== 'all' ? (
                                        'Try adjusting your filters'
                                    ) : (
                                        'Your appointment history will appear here once you complete treatments'
                                    )}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
};

export default AppointmentHistory;
