import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Edit, Loader } from 'lucide-react';
import { Appointment } from '../mocks/appointments';
import AppointmentCard from '../components/common/AppointmentCard';
import Modal from '../components/common/Modal';
import PaymentModeSelector from '../components/common/PaymentModeSelector';
import { appointmentService } from '../services/appointmentService';

const Dashboard: React.FC = () => {
    const userName = localStorage.getItem('userName') || 'Doctor';
    const userRole = localStorage.getItem('userRole') || 'doctor';
    const userId = localStorage.getItem('userId') || '';
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [paymentDetails, setPaymentDetails] = useState({
        amount: 0,
        mode: 'cash',
        notes: '',
    });
    const [editDetails, setEditDetails] = useState({
        date: '',
        time: '',
    });

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            setError('');
            const isAdmin = userRole === 'admin';
            
            const [todayData, upcomingData] = await Promise.all([
                appointmentService.getTodayAppointments(userId, isAdmin),
                appointmentService.getUpcomingAppointments(userId, isAdmin),
            ]);
            
            setTodayAppointments(todayData as any);
            setUpcomingAppointments(upcomingData as any);
        } catch (err) {
            console.error('Error loading appointments:', err);
            setError('Failed to load appointments. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setPaymentDetails({ amount: appointment.amount, mode: 'cash', notes: '' });
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async () => {
        if (!selectedAppointment) return;
        
        setSubmitting(true);
        setError('');

        try {
            await appointmentService.markAsPaid(
                selectedAppointment.id,
                paymentDetails.mode as 'cash' | 'upi',
                paymentDetails.amount,
                paymentDetails.notes
            );
            
            console.log('💰 Payment Recorded:', {
                appointmentId: selectedAppointment.id,
                patientName: selectedAppointment.patientName,
                ...paymentDetails,
                timestamp: new Date().toISOString(),
            });
            console.log('📱 WhatsApp Reminder: Send payment confirmation to patient');
            
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
        setEditDetails({ date: appointment.date, time: appointment.time });
        setShowEditModal(true);
    };

    const handleEditSubmit = async () => {
        if (!selectedAppointment) return;
        
        setSubmitting(true);
        setError('');

        try {
            await appointmentService.update(selectedAppointment.id, {
                date: editDetails.date,
                time: editDetails.time,
            });
            
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

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <Loader className="animate-spin text-primary-600" size={48} />
                    </div>
                )}

                {/* Stats Cards */}
                {!loading && (
                    <>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-600 mb-1">Today's appointments</p>
                                <p className="text-3xl font-bold text-gray-900 leading-none my-2">{todayAppointments.length}</p>
                                <p className="text-xs text-gray-500 mt-1">Task count</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-600 mb-1">Pending tasks</p>
                                <p className="text-3xl font-bold text-gray-900 leading-none my-2">{todayAppointments.filter(a => a.status === 'pending').length}</p>
                                <p className="text-xs text-gray-500 mt-1">Task count</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-600 mb-1">Completed tasks</p>
                                <p className="text-3xl font-bold text-gray-900 leading-none my-2">{todayAppointments.filter(a => a.status === 'completed').length}</p>
                                <p className="text-xs text-gray-500 mt-1">Task count</p>
                            </div>
                        </div>

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
                                        actionLabel="Complete"
                                    />
                                    {appointment.status === 'pending' && (
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {upcomingAppointments.slice(0, 10).map(appointment => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    variant="minimal"
                                    showDate={true}
                                    showAction={false}
                                />
                            ))}
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
                <div className="mb-4">
                    <p className="text-sm text-gray-600">Patient: <span className="font-semibold">{selectedAppointment?.patientName}</span></p>
                    <p className="text-sm text-gray-600">Treatment: <span className="font-semibold">{selectedAppointment?.treatmentType}</span></p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Amount (₹)
                        </label>
                        <input
                            type="number"
                            value={paymentDetails.amount}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, amount: Number(e.target.value) })}
                            className="input-field"
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
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader className="animate-spin" size={18} />
                                Processing...
                            </>
                        ) : (
                            'Complete'
                        )}
                    </button>
                </div>
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
        </main>
    );
};

export default Dashboard;
