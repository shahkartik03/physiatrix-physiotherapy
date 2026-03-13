import React, { useState, useEffect } from 'react';
import { Bell, MessageCircle, Loader, CheckCircle, AlertCircle, Phone, Clock, User, Search, Filter } from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import { patientService } from '../services/patientService';
import { Appointment } from '../types';

type MessageTemplate = 'formal' | 'friendly' | 'hindi' | 'custom';

const Reminders: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'pending'>('all');
    const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate>('friendly');
    const [customMessage, setCustomMessage] = useState('');
    const [clinicAddress, setClinicAddress] = useState('Physiatrix Physiotherapy Clinic');
    const [clinicPhone, setClinicPhone] = useState('8369668284');
    const [sendingId, setSendingId] = useState<string | null>(null);

    useEffect(() => {
        loadTomorrowAppointments();
        // Load clinic info from localStorage if available
        const savedAddress = localStorage.getItem('clinicAddress');
        const savedPhone = localStorage.getItem('clinicPhone');
        if (savedAddress) setClinicAddress(savedAddress);
        if (savedPhone) setClinicPhone(savedPhone);
    }, []);

    useEffect(() => {
        applyFilters();
    }, [appointments, searchTerm, filterStatus]);

    const loadTomorrowAppointments = async () => {
        try {
            setLoading(true);
            setError('');
            
            const userId = localStorage.getItem('userId') || '';
            const userRole = localStorage.getItem('userRole') || '';
            const isAdmin = userRole === 'admin';
            
            // Get all appointments and patients
            const [allAppointments, allPatients] = await Promise.all([
                appointmentService.getAll(userId, isAdmin),
                patientService.getAll()
            ]);
            
            // Create a map of patients for quick lookup
            const patientMap = new Map(allPatients.map(p => [p.id, p]));
            
            // Calculate tomorrow's date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            
            // Filter appointments for tomorrow only
            const tomorrowAppointments = allAppointments.filter(
                (apt: Appointment) => 
                    apt.date === tomorrowStr && 
                    apt.status !== 'cancelled' &&
                    apt.status !== 'canceled' &&
                    apt.status !== 'completed'
            );
            
            // Merge patient phone numbers into appointments
            const appointmentsWithPhone = tomorrowAppointments.map((apt: Appointment) => {
                const patient = patientMap.get(apt.patientId);
                return {
                    ...apt,
                    phone: patient?.phone || ''
                };
            });
            
            // Sort by date and time
            appointmentsWithPhone.sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date);
                if (dateCompare !== 0) return dateCompare;
                return a.time.localeCompare(b.time);
            });
            
            setAppointments(appointmentsWithPhone);
        } catch (err: any) {
            console.error('Error loading appointments:', err);
            setError('Failed to load appointments. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...appointments];
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(apt => 
                apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                apt.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply status filter
        if (filterStatus === 'sent') {
            filtered = filtered.filter(apt => apt.reminderSent === true);
        } else if (filterStatus === 'pending') {
            filtered = filtered.filter(apt => !apt.reminderSent);
        }
        
        setFilteredAppointments(filtered);
    };

    const formatPhoneForWhatsApp = (phone: string): string => {
        if (!phone) return '';
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');
        // Add India country code if not present
        if (!cleaned.startsWith('91') && cleaned.length === 10) {
            return '91' + cleaned;
        }
        return cleaned;
    };

    const validatePhone = (phone: string): boolean => {
        if (!phone) return false;
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 10 || (cleaned.startsWith('91') && cleaned.length === 12);
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const createWhatsAppMessage = (appointment: Appointment, template: MessageTemplate): string => {
        const date = formatDate(appointment.date);
        const patientName = appointment.patientName.split(' ')[0]; // First name only
        
        if (template === 'custom' && customMessage) {
            return customMessage
                .replace(/{patientName}/g, appointment.patientName)
                .replace(/{firstName}/g, patientName)
                .replace(/{date}/g, date)
                .replace(/{time}/g, appointment.time)
                .replace(/{doctorName}/g, appointment.doctorName || 'Doctor')
                .replace(/{treatmentType}/g, appointment.treatmentType || 'Treatment')
                .replace(/{clinicAddress}/g, clinicAddress)
                .replace(/{clinicPhone}/g, clinicPhone);
        }
        
        const templates = {
            formal: `Dear ${appointment.patientName},

This is a reminder that you have an appointment scheduled for tomorrow (${date}) at ${appointment.time} with ${appointment.doctorName} at ${clinicAddress}.

Treatment: ${appointment.treatmentType}

Please call ${clinicPhone} if you need to reschedule.

Thank you.`,
            
            friendly: `Hi ${patientName}! 👋

Just a friendly reminder about your appointment tomorrow:

📅 ${date}
⏰ ${appointment.time}
👨‍⚕️ ${appointment.doctorName}
💼 ${appointment.treatmentType}

📍 ${clinicAddress}

Need to reschedule? Call us at ${clinicPhone}

See you tomorrow! 😊`,
            
            hindi: `नमस्ते ${patientName},

आपकी कल की अपॉइंटमेंट की रिमाइंडर:

📅 तारीख: ${date}
⏰ समय: ${appointment.time}
👨‍⚕️ डॉक्टर: ${appointment.doctorName}
💼 उपचार: ${appointment.treatmentType}

📍 स्थान: ${clinicAddress}

यदि आपको अपॉइंटमेंट बदलनी है तो ${clinicPhone} पर कॉल करें।

धन्यवाद!`
        };
        
        return templates[template as keyof typeof templates] || templates.friendly;
    };

    const handleSendReminder = async (appointment: Appointment) => {
        if (!appointment.phone || !validatePhone(appointment.phone)) {
            alert('Invalid phone number for this patient');
            return;
        }
        
        setSendingId(appointment.id);
        
        try {
            const phone = formatPhoneForWhatsApp(appointment.phone);
            const message = createWhatsAppMessage(appointment, selectedTemplate);
            
            // Detect mobile vs desktop
            const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
            const whatsappUrl = isMobile 
                ? `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`
                : `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
            
            // Open WhatsApp in a new window/tab
            const whatsappWindow = window.open(whatsappUrl, '_blank');
            
            // Ensure current page stays focused (prevent navigation)
            if (whatsappWindow) {
                setTimeout(() => {
                    window.focus();
                }, 100);
            }
            
            // Mark as sent after a short delay (giving time for WhatsApp to open)
            setTimeout(async () => {
                try {
                    const userId = localStorage.getItem('userId') || '';
                    const userName = localStorage.getItem('userName') || '';
                    
                    await appointmentService.update(appointment.id, {
                        reminderSent: true,
                        reminderSentAt: new Date().toISOString(),
                        reminderSentBy: userId,
                        reminderSentByName: userName,
                        reminderMethod: 'whatsapp'
                    });
                    
                    // Reload appointments on current page
                    await loadTomorrowAppointments();
                } catch (err) {
                    console.error('Error marking reminder as sent:', err);
                }
                finally {
                    setSendingId(null);
                }
            }, 1000);
            
        } catch (err) {
            console.error('Error sending reminder:', err);
            alert('Failed to open WhatsApp. Please try again.');
            setSendingId(null);
        }
    };

    const handleSendAllUnsent = () => {
        const unsent = filteredAppointments.filter(apt => !apt.reminderSent && apt.phone && validatePhone(apt.phone));
        
        if (unsent.length === 0) {
            alert('No pending reminders to send');
            return;
        }
        
        if (!confirm(`Send ${unsent.length} reminders? This will open multiple WhatsApp windows.`)) {
            return;
        }
        
        // Send with delay between each to avoid overwhelming the browser
        unsent.forEach((apt, index) => {
            setTimeout(() => {
                handleSendReminder(apt);
            }, index * 1500); // 1.5 second delay between each
        });
    };

    // Calculate stats
    const totalAppointments = appointments.length;
    const sentCount = appointments.filter(apt => apt.reminderSent).length;
    const pendingCount = appointments.filter(apt => !apt.reminderSent && apt.phone && validatePhone(apt.phone)).length;
    const invalidPhoneCount = appointments.filter(apt => !apt.phone || !validatePhone(apt.phone)).length;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = formatDate(tomorrow.toISOString().split('T')[0]);

    return (
        <main className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <div className="container mx-auto px-4 py-6 max-w-6xl">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Bell className="text-accent-500" size={32} />
                        <h1 className="text-2xl md:text-3xl font-bold text-primary-800">
                            Appointment Reminders
                        </h1>
                    </div>
                    <p className="text-gray-600">Send WhatsApp reminders for upcoming appointments</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="card bg-red-50 border-2 border-red-200 mb-6">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="text-red-600" size={20} />
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <Loader className="animate-spin text-primary-600" size={48} />
                    </div>
                )}

                {/* Main Content */}
                {!loading && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                <p className="text-sm opacity-90">Total</p>
                                <p className="text-3xl font-bold">{totalAppointments}</p>
                            </div>
                            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                                <p className="text-sm opacity-90">Sent</p>
                                <p className="text-3xl font-bold">{sentCount}</p>
                            </div>
                            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                                <p className="text-sm opacity-90">Pending</p>
                                <p className="text-3xl font-bold">{pendingCount}</p>
                            </div>
                            <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
                                <p className="text-sm opacity-90">Invalid Phone</p>
                                <p className="text-3xl font-bold">{invalidPhoneCount}</p>
                            </div>
                        </div>

                        {/* Message Template Selector */}
                        <div className="card mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Message Template</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <button
                                    onClick={() => setSelectedTemplate('friendly')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        selectedTemplate === 'friendly'
                                            ? 'bg-accent-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    😊 Friendly
                                </button>
                                <button
                                    onClick={() => setSelectedTemplate('formal')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        selectedTemplate === 'formal'
                                            ? 'bg-accent-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    👔 Formal
                                </button>
                                <button
                                    onClick={() => setSelectedTemplate('hindi')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        selectedTemplate === 'hindi'
                                            ? 'bg-accent-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    🇮🇳 Hindi
                                </button>
                                <button
                                    onClick={() => setSelectedTemplate('custom')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        selectedTemplate === 'custom'
                                            ? 'bg-accent-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    ✏️ Custom
                                </button>
                            </div>
                            
                            {selectedTemplate === 'custom' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Custom Message Template
                                    </label>
                                    <textarea
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        placeholder="Hi {firstName}, your appointment is tomorrow at {time} with {doctorName}..."
                                        className="input-field resize-none"
                                        rows={4}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Available variables: {'{patientName}'}, {'{firstName}'}, {'{date}'}, {'{time}'}, {'{doctorName}'}, {'{treatmentType}'}, {'{clinicAddress}'}, {'{clinicPhone}'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Search and Filter */}
                        <div className="card mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Search className="inline mr-1" size={14} />
                                        Search
                                    </label>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by patient name, phone, or doctor..."
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Filter className="inline mr-1" size={14} />
                                        Filter by Status
                                    </label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as any)}
                                        className="input-field"
                                    >
                                        <option value="all">All Appointments</option>
                                        <option value="pending">Pending Only</option>
                                        <option value="sent">Sent Only</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Bulk Action */}
                        {pendingCount > 0 && (
                            <div className="mb-6">
                                <button
                                    onClick={handleSendAllUnsent}
                                    className="w-full md:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    <MessageCircle size={20} />
                                    Send All Unsent Reminders ({pendingCount})
                                </button>
                            </div>
                        )}

                        {/* Appointments List */}
                        {filteredAppointments.length === 0 ? (
                            <div className="card text-center py-12">
                                <Bell className="mx-auto text-gray-400 mb-4" size={48} />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    {totalAppointments === 0 
                                        ? 'No Upcoming Appointments' 
                                        : 'No Appointments Match Your Filter'}
                                </h3>
                                <p className="text-gray-600">
                                    {totalAppointments === 0 
                                        ? '✓ All caught up! No upcoming appointments found.' 
                                        : 'Try adjusting your search or filter.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredAppointments.map((appointment) => {
                                    const hasValidPhone = appointment.phone ? validatePhone(appointment.phone) : false;
                                    const isSent = appointment.reminderSent;
                                    const isSending = sendingId === appointment.id;
                                    
                                    return (
                                        <div 
                                            key={appointment.id}
                                            className={`card hover:shadow-lg transition-all ${
                                                isSent ? 'bg-green-50 border-green-200' : 
                                                !hasValidPhone ? 'bg-red-50 border-red-200' :
                                                'hover:border-accent-300'
                                            }`}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                {/* Time Badge */}
                                                <div className="flex items-center gap-2 md:w-40 flex-shrink-0">
                                                    <Clock className="text-accent-500" size={20} />
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-800">{appointment.date}</div>
                                                        <div className="text-lg font-bold text-gray-900">{appointment.time}</div>
                                                    </div>
                                                </div>
                                                
                                                {/* Patient Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-lg truncate">
                                                        {appointment.patientName}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
                                                        <div className="flex items-center gap-1">
                                                            <Phone size={14} />
                                                            <span>{appointment.phone || 'No phone'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <User size={14} />
                                                            <span>{appointment.doctorName}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">{appointment.treatmentType}</p>
                                                </div>
                                                
                                                {/* Status/Action */}
                                                <div className="flex items-center gap-3 md:w-64 flex-shrink-0">
                                                    {isSent ? (
                                                        <div className="flex items-center gap-2 text-green-700 bg-green-100 px-4 py-2 rounded-lg w-full justify-center">
                                                            <CheckCircle size={18} />
                                                            <div className="text-sm">
                                                                <div className="font-semibold">Sent</div>
                                                                <div className="text-xs opacity-75">
                                                                    {new Date(appointment.reminderSentAt!).toLocaleTimeString('en-US', {
                                                                        hour: 'numeric',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : !hasValidPhone ? (
                                                        <div className="flex items-center gap-2 text-red-700 bg-red-100 px-4 py-2 rounded-lg w-full justify-center">
                                                            <AlertCircle size={18} />
                                                            <span className="text-sm font-semibold">Invalid Phone</span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSendReminder(appointment)}
                                                            disabled={isSending}
                                                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow hover:shadow-lg flex items-center gap-2 w-full justify-center disabled:opacity-50"
                                                        >
                                                            {isSending ? (
                                                                <>
                                                                    <Loader className="animate-spin" size={18} />
                                                                    Sending...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <MessageCircle size={18} />
                                                                    Send Reminder
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Summary Footer */}
                        {totalAppointments > 0 && (
                            <div className="card mt-6 bg-blue-50 border-blue-200">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                                    <div className="text-sm text-blue-800">
                                        <p className="font-semibold mb-1">Quick Tips:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Click "Send Reminder" to open WhatsApp with a pre-filled message</li>
                                            <li>Review the message and click WhatsApp's send button</li>
                                            <li>The appointment will automatically be marked as "Sent"</li>
                                            <li>Use "Send All Unsent" to open multiple WhatsApp windows at once</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
};

export default Reminders;
