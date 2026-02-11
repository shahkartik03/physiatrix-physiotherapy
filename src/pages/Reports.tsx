import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, User, Loader } from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import { getAllDoctors } from '../services/userService';

interface DoctorWithEarnings {
    uid: string;
    name: string;
    specialty: string;
    commissionRate: number;
    isAdmin: boolean;
    earnings: {
        total: number;
        commission: number;
        net: number;
        count: number;
    };
}

const Reports: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState('2026-02');
    const [doctors, setDoctors] = useState<DoctorWithEarnings[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadReportData();
    }, [selectedMonth]);

    const loadReportData = async () => {
        try {
            setLoading(true);
            setError('');
            
            const userId = localStorage.getItem('userId') || '';
            const userRole = localStorage.getItem('userRole') || '';
            const isAdmin = userRole === 'admin';
            
            // Fetch all doctors and appointments
            const [doctorsData, appointmentsData] = await Promise.all([
                getAllDoctors(),
                appointmentService.getAll(userId, isAdmin)
            ]);

            // Filter appointments for the selected month
            const monthAppointments = appointmentsData.filter(
                (apt: any) => apt.date && apt.date.startsWith(selectedMonth)
            );
            
            // Separate paid and pending appointments
            const paidAppointments = monthAppointments.filter((apt: any) => apt.isPaid === true);
            const pendingAppointments = monthAppointments.filter((apt: any) => apt.isPaid === false || !apt.isPaid);

            // Calculate earnings for each doctor
            const doctorsWithEarnings: DoctorWithEarnings[] = doctorsData.map((doctor: any) => {
                const doctorPaidAppointments = paidAppointments.filter(
                    (apt: any) => apt.doctorId === doctor.uid
                );
                const doctorPendingAppointments = pendingAppointments.filter(
                    (apt: any) => apt.doctorId === doctor.uid
                );

                const total = doctorPaidAppointments.reduce((sum: number, apt: any) => sum + apt.amount, 0);
                const pending = doctorPendingAppointments.reduce((sum: number, apt: any) => sum + apt.amount, 0);
                const commissionRate = (doctor as any).commissionRate || 0;
                const commission = Math.round(total * (commissionRate / 100));
                const net = total - commission;

                return {
                    uid: doctor.uid,
                    name: doctor.name,
                    specialty: doctor.specialty,
                    commissionRate: commissionRate,
                    isAdmin: doctor.isAdmin,
                    earnings: {
                        total,
                        commission,
                        net,
                        count: doctorPaidAppointments.length,
                    },
                    pending: {
                        amount: pending,
                        count: doctorPendingAppointments.length,
                    },
                } as any;
            });

            setDoctors(doctorsWithEarnings);
        } catch (err: any) {
            console.error('Error loading report data:', err);
            // Only show error if it's a real Firebase/network error, not just empty data
            if (err?.code || err?.message?.includes('permission') || err?.message?.includes('index')) {
                setError('Failed to load report data. Please refresh the page.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals
    const totalRevenue = doctors.reduce((sum, doc) => sum + doc.earnings.total, 0);
    const totalPending = doctors.reduce((sum, doc: any) => sum + (doc.pending?.amount || 0), 0);
    const totalCommission = doctors.reduce((sum, doc) => sum + doc.earnings.commission, 0);
    const adminDoctor = doctors.find(doc => doc.isAdmin);
    const adminNetEarnings = adminDoctor ? adminDoctor.earnings.net : 0;
    const totalEarnings = adminNetEarnings + totalCommission;

    return (
        <main className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <div className="container mx-auto px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary-800">Earnings Report</h1>
                    <p className="text-gray-600 mt-1">Commission breakdown by doctor</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="card bg-red-50 border-2 border-red-200 mb-6">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Month Selector */}
                <div className="card mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="inline mr-1" size={16} />
                        Select Month
                    </label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="input-field max-w-xs"
                        disabled={loading}
                    />
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <Loader className="animate-spin text-primary-600" size={48} />
                    </div>
                )}

                {/* Summary Cards */}
                {!loading && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <TrendingUp size={24} className="mb-2" />
                        <p className="text-sm opacity-90">Paid Revenue</p>
                        <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <DollarSign size={24} className="mb-2" />
                        <p className="text-sm opacity-90">Pending</p>
                        <p className="text-3xl font-bold">₹{totalPending.toLocaleString()}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <DollarSign size={24} className="mb-2" />
                        <p className="text-sm opacity-90">Total Commission</p>
                        <p className="text-3xl font-bold">₹{totalCommission.toLocaleString()}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <TrendingUp size={24} className="mb-2" />
                        <p className="text-sm opacity-90">Net Earnings</p>
                        <p className="text-3xl font-bold">₹{totalEarnings.toLocaleString()}</p>
                    </div>
                </div>

                {/* Doctor Breakdown */}
                <div className="space-y-3">
                    <h2 className="text-xl font-bold text-primary-800">Doctor Breakdown</h2>
                    {doctors.map((doctor: any) => {
                        const hasPaid = doctor.earnings.count > 0;
                        const hasPending = doctor.pending?.count > 0;
                        
                        if (!hasPaid && !hasPending) {
                            return null; // Skip doctors with no appointments
                        }

                        return (
                            <div key={doctor.uid} className="card hover:shadow-lg transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-primary-100 p-3 rounded-lg flex-shrink-0">
                                            <User className="text-primary-600" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{doctor.name}</h3>
                                            <p className="text-sm text-gray-600">{doctor.specialty}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Commission Rate: {doctor.commissionRate}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-3 pt-4 border-t">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 mb-1">Paid Appts</p>
                                        <p className="text-lg font-bold text-gray-800">{doctor.earnings.count}</p>
                                    </div>
                                    <div className="text-center border-l">
                                        <p className="text-xs text-gray-600 mb-1">Total Paid</p>
                                        <p className="text-lg font-bold text-green-600">₹{doctor.earnings.total.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center border-l">
                                        <p className="text-xs text-gray-600 mb-1">Commission</p>
                                        <p className="text-lg font-bold text-blue-600">₹{doctor.earnings.commission.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center border-l">
                                        <p className="text-xs text-orange-600 mb-1">Pending</p>
                                        <p className="text-lg font-bold text-orange-600">₹{(doctor.pending?.amount || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-accent-50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Net Earnings (After Commission)</span>
                                        <span className="text-xl font-bold text-accent-600">₹{doctor.earnings.net.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {totalRevenue === 0 && (
                    <div className="card text-center py-8">
                        <p className="text-gray-500">No paid appointments for the selected month</p>
                    </div>
                )}
                </>
                )}
            </div>
        </main>
    );
};

export default Reports;
