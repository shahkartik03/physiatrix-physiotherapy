import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Edit, Loader, AlertCircle, XCircle, CheckCircle, Package } from 'lucide-react';
import { Appointment } from '../mocks/appointments';
import AppointmentCard from '../components/common/AppointmentCard';
import Modal from '../components/common/Modal';
import PaymentModeSelector from '../components/common/PaymentModeSelector';
import TreatmentPackageForm from '../components/scheduling/TreatmentPackageForm';
import { appointmentService } from '../services/appointmentService';
import { getAllDoctors, DoctorProfile } from '../services/userService';
import { getPackageDetails, getPackagePrepaidBalance, isSessionCoveredByPrepaid, getPackagePaymentStatus, recordPackagePayment } from '../services/packageService';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Doctor';
    const userRole = localStorage.getItem('userRole') || 'doctor';
    const userId = localStorage.getItem('userId') || '';
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPackageModal, setShowPackageModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    const [pendingClosureAppointments, setPendingClosureAppointments] = useState<Appointment[]>([]);
    const [packagePaymentWarnings, setPackagePaymentWarnings] = useState<{packageId: string; patientName: string; message: string; alertLevel: string}[]>([]);
    const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [paymentDetails, setPaymentDetails] = useState({
        amount: 0,
        mode: 'cash',
        notes: '',
    });
    const [paymentOption, setPaymentOption] = useState<'collect' | 'complete'>('complete');
    const [packageBalanceInfo, setPackageBalanceInfo] = useState<{
        totalAmount: number;
        amountPaid: number;
        sessionCost: number;
        sessionsUsed: number;
        balanceRemaining: number;
        isLastSession: boolean;
        remainingSessions: number;
    } | null>(null);
    const [editDetails, setEditDetails] = useState({
        date: '',
        time: '',
        doctorId: '',
        doctorName: '',
    });

    useEffect(() => {
        loadAppointments();
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        try {
            const doctorsList = await getAllDoctors();
            setDoctors(doctorsList.filter(d => d.isActive));
        } catch (err) {
            console.error('Error loading doctors:', err);
        }
    };

    const loadAppointments = async () => {
        try {
            setLoading(true);
            setError('');
            // Dashboard shows only MY appointments, even for admins
            // Use Schedule page to see all appointments
            // Pass false to always filter by doctorId (not admin mode)
            const isAdminView = false;
            
            console.log('🔍 LOADING MY APPOINTMENTS FOR:', {
                userId,
                userName,
                userRole,
                filteringByDoctorId: true
            });
            
            // Load each type separately with individual error handling
            const todayPromise = appointmentService.getTodayAppointments(userId, isAdminView).catch(err => {
                console.error('Error loading today appointments:', err);
                return [];
            });
            
            const upcomingPromise = appointmentService.getUpcomingAppointments(userId, isAdminView).catch(err => {
                console.error('Error loading upcoming appointments:', err);
                return [];
            });
            
            const pendingPromise = appointmentService.getPendingClosure(userId, isAdminView).catch(err => {
                console.error('Error loading pending closure:', err);
                return [];
            });
            
            const [todayData, upcomingData, pendingData] = await Promise.all([
                todayPromise,
                upcomingPromise,
                pendingPromise
            ]);
            
            console.log('📊 APPOINTMENTS LOADED:', {
                today: todayData.length,
                upcoming: upcomingData.length,
                pending: pendingData.length,
                todayAppointments: todayData.map((apt: any) => ({ 
                    id: apt.id, 
                    patient: apt.patientName, 
                    doctor: apt.doctorName,
                    doctorId: apt.doctorId 
                }))
            });
            
            setTodayAppointments(todayData as any);
            setUpcomingAppointments(upcomingData as any);
            setPendingClosureAppointments(pendingData as any);
            
            // Check package balances for all package sessions
            await checkPackageBalances([...todayData, ...upcomingData, ...pendingData] as Appointment[]);
        } catch (err) {
            console.error('Error loading appointments:', err);
            setError('Failed to load appointments. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };
    
    const checkPackageBalances = async (appointments: Appointment[]) => {
        const warnings: {packageId: string; patientName: string; message: string; alertLevel: string}[] = [];
        const checkedPackages = new Set<string>();
        
        for (const apt of appointments) {
            if (apt.isPackageSession && apt.packageId && !checkedPackages.has(apt.packageId)) {
                checkedPackages.add(apt.packageId);
                try {
                    const packageDetails = await getPackageDetails(apt.packageId);
                    const paymentStatus = getPackagePaymentStatus(packageDetails);
                    
                    if (paymentStatus.alertLevel !== 'none') {
                        warnings.push({
                            packageId: apt.packageId,
                            patientName: apt.patientName,
                            message: paymentStatus.message,
                            alertLevel: paymentStatus.alertLevel
                        });
                    }
                } catch (error) {
                    console.error(`Error checking package balance for ${apt.packageId}:`, error);
                }
            }
        }
        
        setPackagePaymentWarnings(warnings);
    };

    const handleMarkComplete = async (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        
        // For package sessions, dynamically check if prepaid balance covers this session
        if (appointment.isPackageSession && appointment.packageId) {
            try {
                const packageDetails = await getPackageDetails(appointment.packageId);
                const paymentStatus = getPackagePaymentStatus(packageDetails);
                const prepaidBalance = getPackagePrepaidBalance(packageDetails);
                const isLastSession = packageDetails.remainingSessions === 1;
                
                // Set package balance info for display
                const totalBalanceOwed = packageDetails.totalAmount - packageDetails.amountPaid;
                setPackageBalanceInfo({
                    totalAmount: packageDetails.totalAmount,
                    amountPaid: packageDetails.amountPaid,
                    sessionCost: packageDetails.pricePerSession,
                    sessionsUsed: packageDetails.completedSessions,
                    balanceRemaining: totalBalanceOwed, // Total amount still owed
                    isLastSession: isLastSession,
                    remainingSessions: packageDetails.remainingSessions
                });
                
                // If last session with balance, force payment collection
                if (isLastSession && totalBalanceOwed > 0) {
                    setPaymentOption('collect');
                    setPaymentDetails({ 
                        amount: totalBalanceOwed, // Set to full balance for last session
                        mode: 'cash', 
                        notes: `Final session - Collecting remaining balance of ₹${totalBalanceOwed.toLocaleString()}` 
                    });
                } else if (paymentStatus.requiresPayment) {
                    // Balance insufficient - suggest payment
                    setPaymentOption('collect');
                    setPaymentDetails({ 
                        amount: Math.min(appointment.amount || packageDetails.pricePerSession, totalBalanceOwed), 
                        mode: 'cash', 
                        notes: `Session ${appointment.sessionNumber} - ${paymentStatus.message}` 
                    });
                } else {
                    // Session covered by prepaid balance - can skip payment
                    setPaymentOption('complete');
                    setPaymentDetails({ 
                        amount: 0, 
                        mode: 'cash', 
                        notes: `Package session - Prepaid (Balance: ₹${paymentStatus.prepaidBalance.toLocaleString()})` 
                    });
                }
            } catch (error) {
                console.error('Error fetching package details:', error);
                setPackageBalanceInfo(null);
                // Fallback to appointment's isPrePaid flag
                if (appointment.isPrePaid) {
                    setPaymentDetails({ amount: 0, mode: 'cash', notes: 'Package session - pre-paid' });
                } else {
                    setPaymentDetails({ amount: appointment.amount, mode: 'cash', notes: '' });
                }
            }
        } else {
            // Clear package balance info for non-package appointments
            setPackageBalanceInfo(null);
            
            if (appointment.isPrePaid && appointment.status !== 'completed') {
                // Legacy prepaid appointments
                setPaymentDetails({ amount: 0, mode: 'cash', notes: 'Package session - pre-paid' });
            } else {
                // Regular appointments
                setPaymentDetails({ amount: appointment.amount, mode: 'cash', notes: '' });
            }
        }
        
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async () => {
        if (!selectedAppointment) return;
        
        // Validate payment amount for package sessions
        if (packageBalanceInfo && paymentOption === 'collect') {
            if (paymentDetails.amount > packageBalanceInfo.balanceRemaining) {
                setError(`Payment amount cannot exceed remaining balance of ₹${packageBalanceInfo.balanceRemaining.toLocaleString()}`);
                alert(`Payment amount cannot exceed remaining balance of ₹${packageBalanceInfo.balanceRemaining.toLocaleString()}`);
                return;
            }
            
            // If last session, must collect full balance
            if (packageBalanceInfo.isLastSession && paymentDetails.amount < packageBalanceInfo.balanceRemaining) {
                setError(`Last session requires collecting full balance of ₹${packageBalanceInfo.balanceRemaining.toLocaleString()}`);
                alert(`Last session requires collecting full balance of ₹${packageBalanceInfo.balanceRemaining.toLocaleString()}`);
                return;
            }
        }
        
        // Prevent completing last session without payment if balance exists
        if (packageBalanceInfo?.isLastSession && packageBalanceInfo.balanceRemaining > 0 && paymentOption === 'complete') {
            setError('Last session requires balance collection. Please select "Collect Payment" option.');
            alert('Last session requires balance collection. Please select "Collect Payment" option.');
            return;
        }
        
        setSubmitting(true);
        setError('');

        try {
            // For regular (non-package) appointments: if amount > 0, always collect payment
            // For package appointments: respect the paymentOption toggle
            const isRegularAppointment = !selectedAppointment.isPackageSession;
            const isPaymentCollected = isRegularAppointment 
                ? paymentDetails.amount > 0 
                : (paymentOption === 'collect' && paymentDetails.amount > 0);
            
            if (isPaymentCollected) {
                // Payment being collected - regular or package session with balance due
                await appointmentService.markAsPaid(
                    selectedAppointment.id,
                    paymentDetails.mode as 'cash' | 'upi',
                    paymentDetails.amount,
                    paymentDetails.notes
                );
                
                // If this is a package session, update package's amountPaid
                if (selectedAppointment.isPackageSession && selectedAppointment.packageId) {
                    await recordPackagePayment(
                        selectedAppointment.packageId,
                        paymentDetails.amount,
                        paymentDetails.mode as 'cash' | 'upi'
                    );
                    // Note: completePackageSession is called inside markAsPaid, no need to call again
                }
                
                console.log('💰 Payment Recorded:', {
                    appointmentId: selectedAppointment.id,
                    patientName: selectedAppointment.patientName,
                    packageId: selectedAppointment.packageId,
                    sessionNumber: selectedAppointment.sessionNumber,
                    isRegularAppointment,
                    ...paymentDetails,
                    timestamp: new Date().toISOString(),
                });
                console.log('📱 WhatsApp Reminder: Send payment confirmation to patient');
            } else {
                // Option 2: Mark complete without payment collection
                
                if (selectedAppointment.isPackageSession) {
                    // For package sessions: use dedicated function that preserves service value (pricePerSession)
                    // This ensures all sessions show correct ₹700 amount for accurate reporting
                    await appointmentService.completePackageSessionWithoutPayment(
                        selectedAppointment.id
                    );
                    // Note: completePackageSession is called inside completePackageSessionWithoutPayment
                } else {
                    // For regular appointments: use markAsPaid with ₹0 amount
                    const paymentMethodToUse = (selectedAppointment.paymentMode === 'cash' || selectedAppointment.paymentMode === 'upi') 
                        ? selectedAppointment.paymentMode 
                        : 'cash'; // Default fallback
                    
                    await appointmentService.markAsPaid(
                        selectedAppointment.id,
                        paymentMethodToUse,
                        0,
                        paymentDetails.notes || 'Session completed'
                    );
                }
                
                console.log('✅ Session Completed:', {
                    appointmentId: selectedAppointment.id,
                    patientName: selectedAppointment.patientName,
                    packageId: selectedAppointment.packageId,
                    sessionNumber: selectedAppointment.sessionNumber,
                    isPackageSession: selectedAppointment.isPackageSession,
                    paymentCollected: false,
                    timestamp: new Date().toISOString(),
                });
            }
            
            setShowPaymentModal(false);
            await loadAppointments();
        } catch (err) {
            console.error('Error marking appointment as paid:', err);
            setError('Failed to complete payment. Please try again.');
            alert('Failed to complete payment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditAppointment = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setEditDetails({ 
            date: appointment.date, 
            time: appointment.time,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctorName 
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async () => {
        if (!selectedAppointment) return;
        
        setSubmitting(true);
        setError('');

        try {
            // Check if patient already has an appointment on the new date (only if date is changing)
            if (editDetails.date !== selectedAppointment.date) {
                const patientAppointments = await appointmentService.getByPatientId(selectedAppointment.patientId);
                const hasConflict = patientAppointments.some(
                    apt => apt.id !== selectedAppointment.id && 
                           apt.date === editDetails.date && 
                           apt.status !== 'cancelled' && 
                           apt.status !== 'canceled'
                );
                
                if (hasConflict) {
                    alert(`${selectedAppointment.patientName} already has an appointment scheduled on ${editDetails.date}. Please choose a different date.`);
                    setSubmitting(false);
                    return;
                }
            }
            
            console.log('📝 UPDATING APPOINTMENT:', {
                appointmentId: selectedAppointment.id,
                oldDoctor: selectedAppointment.doctorName,
                newDoctor: editDetails.doctorName,
                oldDoctorId: selectedAppointment.doctorId,
                newDoctorId: editDetails.doctorId,
                date: editDetails.date,
                time: editDetails.time
            });
            
            await appointmentService.update(selectedAppointment.id, {
                date: editDetails.date,
                time: editDetails.time,
                doctorId: editDetails.doctorId,
                doctorName: editDetails.doctorName,
            });
            
            console.log('✅ UPDATE COMPLETED - Reloading appointments...');
            setShowEditModal(false);
            await loadAppointments();
        } catch (err) {
            console.error('Error updating appointment:', err);
            setError('Failed to update appointment. Please try again.');
            alert('Failed to update appointment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkNoShow = async (appointment: Appointment) => {
        if (!confirm(`Mark ${appointment.patientName} as no-show?`)) return;
        
        setSubmitting(true);
        setError('');

        try {
            await appointmentService.markNoShow(appointment.id);
            
            console.log('❌ No-Show Marked:', {
                appointmentId: appointment.id,
                patientName: appointment.patientName,
                date: appointment.date,
                timestamp: new Date().toISOString(),
            });
            
            await loadAppointments();
        } catch (err) {
            console.error('Error marking no-show:', err);
            setError('Failed to mark as no-show. Please try again.');
            alert('Failed to mark as no-show. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConvertToPackage = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setShowPackageModal(true);
    };

    const handlePackageCreated = async (packageId: string) => {
        console.log('✅ Package created:', packageId);
        setShowPackageModal(false);
        setSelectedAppointment(null);
        // Reload appointments to reflect any changes
        await loadAppointments();
        alert('Package created successfully! The appointment has been converted to a treatment package.');
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <div className="container mx-auto px-4 py-6">
                {/* Welcome Section */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary-800">{userName}</h1>
                    <p className="text-gray-600 mt-1">Your schedule for today</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="card bg-red-50 border-2 border-red-200 mb-6">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Package Payment Warnings */}
                {!loading && packagePaymentWarnings.length > 0 && (
                    <div className="mb-6 space-y-2">
                        {packagePaymentWarnings.map((warning, index) => (
                            <div 
                                key={index}
                                className={`card border-2 ${
                                    warning.alertLevel === 'critical' 
                                        ? 'bg-red-50 border-red-400' 
                                        : 'bg-amber-50 border-amber-400'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <AlertCircle 
                                        size={20} 
                                        className={warning.alertLevel === 'critical' ? 'text-red-600 mt-0.5' : 'text-amber-600 mt-0.5'} 
                                    />
                                    <div className="flex-1">
                                        <p className={`font-semibold text-sm ${
                                            warning.alertLevel === 'critical' ? 'text-red-800' : 'text-amber-800'
                                        }`}>
                                            {warning.patientName}'s Package Payment Alert
                                        </p>
                                        <p className={`text-sm mt-1 ${
                                            warning.alertLevel === 'critical' ? 'text-red-700' : 'text-amber-700'
                                        }`}>
                                            {warning.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <Loader className="animate-spin text-primary-600" size={48} />
                    </div>
                )}

                {/* Stats Cards */}
                {!loading && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-600 mb-1">Today's appointments</p>
                                <p className="text-3xl font-bold text-gray-900 leading-none my-2">{todayAppointments.length}</p>
                                <p className="text-xs text-gray-500 mt-1">Task count</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-600 mb-1">Pending tasks</p>
                                <p className="text-3xl font-bold text-gray-900 leading-none my-2">{todayAppointments.filter(a => a.status === 'pending' || a.status === 'scheduled').length}</p>
                                <p className="text-xs text-gray-500 mt-1">Task count</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-600 mb-1">Completed tasks</p>
                                <p className="text-3xl font-bold text-gray-900 leading-none my-2">{todayAppointments.filter(a => a.status === 'completed').length}</p>
                                <p className="text-xs text-gray-500 mt-1">Task count</p>
                            </div>
                            <button
                                onClick={() => navigate('/history')}
                                className="bg-white hover:bg-gray-50 rounded-lg border border-gray-200 p-4 transition-all shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center"
                            >
                                <img 
                                    src="/history-icon.svg" 
                                    alt="History" 
                                    className="w-12 h-12 mb-2"
                                />
                                <p className="text-xs text-gray-600">History</p>
                            </button>
                        </div>

                        {/* Pending Closure - Needs Immediate Action */}
                        {pendingClosureAppointments.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-red-700 mb-3 flex items-center gap-2">
                                    <AlertCircle size={20} className="text-red-600" />
                                    Needs Action ({pendingClosureAppointments.length})
                                </h2>
                                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-3">
                                    <p className="text-sm text-red-800">
                                        These past appointments need to be closed. Mark as completed with payment, reschedule, or mark as no-show.
                                    </p>
                                </div>
                                
                                {/* Compact Table View */}
                                <div className="bg-white border border-red-300 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-red-100 border-b border-red-200">
                                                <tr>
                                                    <th className="text-left py-2 px-3 text-xs font-semibold text-red-900">Date</th>
                                                    <th className="text-left py-2 px-3 text-xs font-semibold text-red-900">Patient</th>
                                                    <th className="text-left py-2 px-3 text-xs font-semibold text-red-900">Treatment</th>
                                                    <th className="text-left py-2 px-3 text-xs font-semibold text-red-900">Time</th>
                                                    {userRole === 'admin' && <th className="text-left py-2 px-3 text-xs font-semibold text-red-900">Doctor</th>}
                                                    <th className="text-right py-2 px-3 text-xs font-semibold text-red-900">Amount</th>
                                                    <th className="text-center py-2 px-3 text-xs font-semibold text-red-900">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingClosureAppointments.map((appointment, index) => (
                                                    <tr key={appointment.id} className={`border-b border-gray-100 hover:bg-red-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                        <td className="py-2.5 px-3 text-sm text-gray-700">
                                                            {new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-sm font-semibold text-gray-900">{appointment.patientName}</td>
                                                        <td className="py-2.5 px-3 text-sm text-gray-600">{appointment.treatmentType}</td>
                                                        <td className="py-2.5 px-3 text-sm text-gray-700">{appointment.time}</td>
                                                        {userRole === 'admin' && <td className="py-2.5 px-3 text-sm text-blue-600">{appointment.doctorName}</td>}
                                                        <td className="py-2.5 px-3 text-sm font-bold text-gray-900 text-right">₹{appointment.amount}</td>
                                                        <td className="py-2.5 px-3">
                                                            <div className="flex gap-1 justify-center flex-wrap">
                                                                {!appointment.isPackageSession && (
                                                                    <button
                                                                        onClick={() => handleConvertToPackage(appointment)}
                                                                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs py-1.5 px-2.5 rounded transition-all whitespace-nowrap flex items-center gap-1"
                                                                        disabled={submitting}
                                                                        title="Convert to Package"
                                                                    >
                                                                        <Package size={12} />
                                                                        Package
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleMarkComplete(appointment)}
                                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 px-2.5 rounded transition-all whitespace-nowrap flex items-center gap-1"
                                                                    disabled={submitting}
                                                                    title="Complete & Pay"
                                                                >
                                                                    <CheckCircle size={12} />
                                                                    Pay
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditAppointment(appointment)}
                                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-2.5 rounded transition-all whitespace-nowrap flex items-center gap-1"
                                                                    disabled={submitting}
                                                                    title="Reschedule"
                                                                >
                                                                    <Edit size={12} />
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleMarkNoShow(appointment)}
                                                                    className="bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 px-2.5 rounded transition-all whitespace-nowrap flex items-center gap-1"
                                                                    disabled={submitting}
                                                                    title="No-Show"
                                                                >
                                                                    <XCircle size={12} />
                                                                    No-Show
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Today's Appointments - Active Focus */}
                        {todayAppointments.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-primary-800 mb-3 flex items-center gap-2">
                            <Clock size={20} className="text-accent-500" />
                            Today's Patients
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {todayAppointments.map(appointment => (
                                <div key={appointment.id} className="relative">
                                    <AppointmentCard
                                        appointment={appointment}
                                        variant="full"
                                        showAction={true}
                                        onAction={handleMarkComplete}
                                        onConvertToPackage={handleConvertToPackage}
                                        actionLabel="Complete"
                                    />
                                    {(appointment.status === 'pending' || appointment.status === 'scheduled') && (
                                        <button
                                            onClick={() => handleEditAppointment(appointment)}
                                            className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-lg transition-all shadow-sm"
                                            title="Edit appointment"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upcoming Appointments - Minimal View */}
                {upcomingAppointments.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-primary-800 mb-3 flex items-center gap-2">
                            <Calendar size={20} className="text-blue-500" />
                            Upcoming ({upcomingAppointments.length})
                        </h2>
                        <div className="max-h-96 overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {upcomingAppointments.map(appointment => (
                                    <div key={appointment.id} className="relative">
                                        <AppointmentCard
                                            appointment={appointment}
                                            variant="minimal"
                                            showDate={true}
                                            showAction={false}
                                        />
                                        <button
                                            onClick={() => handleEditAppointment(appointment)}
                                            className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-lg transition-all shadow-sm"
                                            title="Reschedule appointment"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </>
            )}
            </div>

            {/* Payment Modal */}
            <Modal 
                isOpen={showPaymentModal} 
                onClose={() => setShowPaymentModal(false)} 
                title="Complete Treatment"
            >
                {selectedAppointment?.isPackageSession ? (
                    /* Enhanced Modal for Package Sessions */
                    <>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">Patient: <span className="font-semibold">{selectedAppointment?.patientName}</span></p>
                            <p className="text-sm text-gray-600">Treatment: <span className="font-semibold">{selectedAppointment?.treatmentType}</span></p>
                            <div className="mt-2">
                                <p className="text-xs text-gray-600">📦 Package Session #{selectedAppointment.sessionNumber}</p>
                            </div>
                            
                            {/* Package Balance Card */}
                            {packageBalanceInfo && (
                                <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-2">💼 Package Balance Summary</h4>
                                    {packageBalanceInfo.isLastSession && packageBalanceInfo.balanceRemaining > 0 && (
                                        <div className="mb-2 p-2 bg-amber-100 border border-amber-300 rounded text-xs text-amber-800 font-medium">
                                            ⚠️ Last Session - Full balance must be collected
                                        </div>
                                    )}
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Package Total:</span>
                                            <span className="font-semibold text-gray-800">₹{packageBalanceInfo.totalAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Amount Paid:</span>
                                            <span className="font-semibold text-green-600">₹{packageBalanceInfo.amountPaid.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Sessions Completed:</span>
                                            <span className="font-medium text-gray-700">{packageBalanceInfo.sessionsUsed} × ₹{packageBalanceInfo.sessionCost}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Amount Used:</span>
                                            <span className="font-medium text-gray-700">₹{(packageBalanceInfo.sessionsUsed * packageBalanceInfo.sessionCost).toLocaleString()}</span>
                                        </div>
                                        {packageBalanceInfo.amountPaid < (packageBalanceInfo.sessionsUsed * packageBalanceInfo.sessionCost) && (
                                            <div className="flex justify-between items-center p-2 bg-red-50 border border-red-200 rounded mt-1">
                                                <span className="text-red-700 font-semibold text-xs">⚠️ Payment Deficit:</span>
                                                <span className="font-bold text-red-600">
                                                    -₹{((packageBalanceInfo.sessionsUsed * packageBalanceInfo.sessionCost) - packageBalanceInfo.amountPaid).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="border-t border-blue-300 pt-1 mt-1"></div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Current Session Cost:</span>
                                            <span className="font-semibold text-gray-800">₹{packageBalanceInfo.sessionCost.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Remaining Sessions:</span>
                                            <span className="font-medium text-gray-700">{packageBalanceInfo.remainingSessions}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Radio Button Options */}
                        <div className="mb-4 space-y-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Choose Action:</label>
                            
                            <label className="flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                                   style={{ borderColor: paymentOption === 'collect' ? '#3b82f6' : '#d1d5db' }}>
                                <input
                                    type="radio"
                                    name="paymentOption"
                                    value="collect"
                                    checked={paymentOption === 'collect'}
                                    onChange={(e) => setPaymentOption(e.target.value as 'collect' | 'complete')}
                                    className="mt-1 mr-3"
                                />
                                <div>
                                    <div className="font-semibold text-gray-800">💰 Collect Payment & Complete</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        Take full or partial payment from patient now
                                    </div>
                                </div>
                            </label>
                            
                            <label className={`flex items-start p-3 border-2 rounded-lg transition-all ${
                                packageBalanceInfo?.isLastSession && packageBalanceInfo?.balanceRemaining > 0 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'cursor-pointer hover:bg-gray-50'
                            }`}
                                   style={{ borderColor: paymentOption === 'complete' ? '#3b82f6' : '#d1d5db' }}>
                                <input
                                    type="radio"
                                    name="paymentOption"
                                    value="complete"
                                    checked={paymentOption === 'complete'}
                                    onChange={(e) => setPaymentOption(e.target.value as 'collect' | 'complete')}
                                    className="mt-1 mr-3"
                                    disabled={packageBalanceInfo?.isLastSession && packageBalanceInfo?.balanceRemaining > 0}
                                />
                                <div>
                                    <div className="font-semibold text-gray-800">✅ Mark as Complete (No Payment)</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        Complete session without collecting payment now
                                        {packageBalanceInfo?.isLastSession && packageBalanceInfo?.balanceRemaining > 0 && (
                                            <span className="block text-red-600 font-medium mt-1">⚠️ Not available - Last session requires balance collection</span>
                                        )}
                                    </div>
                                </div>
                            </label>
                        </div>
                        
                        {/* Payment Collection Fields - Show only when 'collect' is selected */}
                        {paymentOption === 'collect' && (
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700">Payment Details</h4>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Amount (₹) {packageBalanceInfo && !packageBalanceInfo.isLastSession && (
                                            <span className="text-xs text-gray-500">- Editable for partial payment</span>
                                        )}
                                        {packageBalanceInfo?.isLastSession && (
                                            <span className="text-xs text-red-600 font-medium">- Full balance required</span>
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        value={paymentDetails.amount === 0 ? '' : paymentDetails.amount}
                                        onChange={(e) => {
                                            const value = e.target.value === '' ? 0 : Number(e.target.value);
                                            const maxAmount = packageBalanceInfo?.balanceRemaining || Infinity;
                                            // Prevent entering more than max payable
                                            if (value <= maxAmount) {
                                                setPaymentDetails({ ...paymentDetails, amount: value });
                                            }
                                        }}
                                        onBlur={(e) => {
                                            // Ensure value doesn't exceed max on blur
                                            const value = Number(e.target.value);
                                            const maxAmount = packageBalanceInfo?.balanceRemaining || Infinity;
                                            if (value > maxAmount) {
                                                setPaymentDetails({ ...paymentDetails, amount: maxAmount });
                                            }
                                        }}
                                        className="input-field"
                                        min="0"
                                        max={packageBalanceInfo?.balanceRemaining}
                                        disabled={packageBalanceInfo?.isLastSession}
                                    />
                                    {packageBalanceInfo && (
                                        <div className="mt-1 flex items-start gap-1">
                                            <p className="text-xs text-gray-600">
                                                💡 Max amount payable: <span className="font-semibold text-orange-600">₹{packageBalanceInfo.balanceRemaining.toLocaleString()}</span>
                                            </p>
                                        </div>
                                    )}
                                    {packageBalanceInfo && paymentDetails.amount > packageBalanceInfo.balanceRemaining && (
                                        <p className="text-xs text-red-600 font-medium mt-1">
                                            ⚠️ Amount cannot exceed remaining balance of ₹{packageBalanceInfo.balanceRemaining.toLocaleString()}
                                        </p>
                                    )}
                                </div>

                                <PaymentModeSelector
                                    selectedMode={paymentDetails.mode as 'cash' | 'upi'}
                                    onChange={(mode) => setPaymentDetails({ ...paymentDetails, mode })}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Treatment Notes (Optional)
                                    </label>
                                    <textarea
                                        value={paymentDetails.notes}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, notes: e.target.value })}
                                        className="input-field"
                                        rows={3}
                                        placeholder="Add any notes about the treatment..."
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1 btn-secondary"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePaymentSubmit}
                                className="flex-1 btn-primary flex items-center justify-center gap-2"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader className="animate-spin" size={18} />
                                        Processing...
                                    </>
                                ) : (
                                    paymentOption === 'collect' 
                                        ? '💰 Collect & Complete' 
                                        : '✅ Mark Complete'
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    /* Simple Modal for Individual Appointments */
                    <>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">Patient: <span className="font-semibold">{selectedAppointment?.patientName}</span></p>
                            <p className="text-sm text-gray-600">Treatment: <span className="font-semibold">{selectedAppointment?.treatmentType}</span></p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    value={paymentDetails.amount === 0 ? '' : paymentDetails.amount}
                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, amount: e.target.value === '' ? 0 : Number(e.target.value) })}
                                    className="input-field"
                                    min="0"
                                    required
                                />
                            </div>

                            <PaymentModeSelector
                                selectedMode={paymentDetails.mode as 'cash' | 'upi'}
                                onChange={(mode) => setPaymentDetails({ ...paymentDetails, mode })}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Treatment Notes (Optional)
                                </label>
                                <textarea
                                    value={paymentDetails.notes}
                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, notes: e.target.value })}
                                    className="input-field"
                                    rows={3}
                                    placeholder="Add any notes about the treatment..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1 btn-secondary"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePaymentSubmit}
                                className="flex-1 btn-primary flex items-center justify-center gap-2"
                                disabled={submitting || !paymentDetails.amount}
                            >
                                {submitting ? (
                                    <>
                                        <Loader className="animate-spin" size={18} />
                                        Processing...
                                    </>
                                ) : (
                                    '💰 Mark as Paid'
                                )}
                            </button>
                        </div>
                    </>
                )}
            </Modal>

            {/* Edit Appointment Modal */}
            <Modal 
                isOpen={showEditModal} 
                onClose={() => setShowEditModal(false)} 
                title="Edit Appointment"
            >
                <div className="mb-4">
                    <p className="text-sm text-gray-600">Patient: <span className="font-semibold">{selectedAppointment?.patientName}</span></p>
                    <p className="text-sm text-gray-600">Treatment: <span className="font-semibold">{selectedAppointment?.treatmentType}</span></p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Doctor <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={editDetails.doctorId}
                            onChange={(e) => {
                                const selectedDoctor = doctors.find(d => d.uid === e.target.value);
                                setEditDetails({ 
                                    ...editDetails, 
                                    doctorId: e.target.value,
                                    doctorName: selectedDoctor?.name || ''
                                });
                            }}
                            className="input-field"
                        >
                            <option value="">Select Doctor</option>
                            {doctors.map(doctor => (
                                <option key={doctor.uid} value={doctor.uid}>
                                    {doctor.name} - {doctor.specialty}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={editDetails.date}
                            onChange={(e) => setEditDetails({ ...editDetails, date: e.target.value })}
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            value={editDetails.time}
                            onChange={(e) => setEditDetails({ ...editDetails, time: e.target.value })}
                            className="input-field"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => setShowEditModal(false)}
                        className="flex-1 btn-secondary"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleEditSubmit}
                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader className="animate-spin" size={18} />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </Modal>

            {/* Convert to Package Modal */}
            {showPackageModal && selectedAppointment && (
                <Modal 
                    isOpen={showPackageModal} 
                    onClose={() => {
                        setShowPackageModal(false);
                        setSelectedAppointment(null);
                    }} 
                    title="Convert to Treatment Package"
                >
                    <TreatmentPackageForm
                        preSelectedPatientId={selectedAppointment.patientId}
                        preSelectedPatientName={selectedAppointment.patientName}
                        sourceAppointmentId={selectedAppointment.id}
                        onSuccess={handlePackageCreated}
                        onCancel={() => {
                            setShowPackageModal(false);
                            setSelectedAppointment(null);
                        }}
                    />
                </Modal>
            )}
        </main>
    );
};

export default Dashboard;
