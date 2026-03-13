import React, { useState } from 'react';
import { UserPlus, Mail, Phone, Briefcase, DollarSign, Clock, Key, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { createDoctorAccount } from '../services/userService';

const Onboarding: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialty: '',
        commissionRate: '',
        startTime: '09:00',
        endTime: '17:00',
        temporaryPassword: '',
        isAdmin: false,
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const generateTemporaryPassword = () => {
        // Generate a random 8-character password
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    const handleGeneratePassword = () => {
        setFormData({ ...formData, temporaryPassword: generateTemporaryPassword() });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        // Validate phone number
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(formData.phone.replace(/[- ]/g, ''))) {
            setError('Please enter a valid 10-digit phone number');
            setSubmitting(false);
            return;
        }

        // Validate commission rate
        const commission = parseFloat(formData.commissionRate);
        if (isNaN(commission) || commission < 0 || commission > 100) {
            setError('Commission rate must be between 0 and 100');
            setSubmitting(false);
            return;
        }

        console.log('🏥 Doctor Onboarding Event:', {
            ...formData,
            workingDays: 'Monday to Saturday',
            timestamp: new Date().toISOString(),
        });

        // Create doctor account
        const result = await createDoctorAccount({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            specialty: formData.specialty,
            isAdmin: formData.isAdmin,
            temporaryPassword: formData.temporaryPassword,
            commissionRate: commission,
            startTime: formData.startTime,
            endTime: formData.endTime,
            sendEmail: false, // Don't send email for dummy accounts
        });

        setSubmitting(false);

        if (result.success) {
            setSuccess(
                `✅ Doctor account created successfully!\n\n` +
                `📧 Email: ${formData.email}\n` +
                `🔑 Temporary Password: ${formData.temporaryPassword}\n\n` +
                `You can now login as this doctor to add backdated appointments.`
            );

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                specialty: '',
                commissionRate: '',
                startTime: '09:00',
                endTime: '17:00',
                temporaryPassword: '',
                isAdmin: false,
            });
        } else {
            setError(result.message);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <div className="container mx-auto px-4 py-6">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-6">
                        <div className="bg-accent-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="text-accent-600" size={32} />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-primary-800">Onboard New Doctor</h1>
                        <p className="text-gray-600 mt-2">Add a new doctor to your practice</p>
                    </div>

                    <form onSubmit={handleSubmit} className="card space-y-4">
                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                                    <div className="text-sm text-green-800 whitespace-pre-line font-medium">
                                        {success}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                                <AlertCircle size={20} />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Doctor Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input-field"
                                placeholder="Dr. John Smith"
                                required
                                disabled={submitting}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address * (Can be dummy email)
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-field input-with-icon"
                                    placeholder="doctor1@temp.com or real email"
                                    required
                                    disabled={submitting}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Use a dummy email for testing or real email for actual doctors
                            </p>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number *
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input-field input-with-icon"
                                    placeholder="9876543210"
                                    required
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* Specialty */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Specialty *
                            </label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={formData.specialty}
                                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                    className="input-field input-with-icon"
                                    placeholder="Physiotherapy, Sports Medicine, etc."
                                    required
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* Commission Rate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Commission Rate (%) *
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="number"
                                    value={formData.commissionRate === '' ? '' : formData.commissionRate}
                                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                                    className="input-field input-with-icon"
                                    placeholder="15"
                                    min="0"
                                    max="100"
                                    required
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* Temporary Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Temporary Password *
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={formData.temporaryPassword}
                                        onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                                        className="input-field input-with-icon"
                                        placeholder="Auto-generate or enter manually"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGeneratePassword}
                                    className="btn btn-secondary whitespace-nowrap"
                                    disabled={submitting}
                                >
                                    Generate
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Save this password - you'll need it to login as this doctor
                            </p>
                        </div>

                        {/* Admin Privileges */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isAdmin"
                                checked={formData.isAdmin}
                                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                disabled={submitting}
                            />
                            <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-700">
                                <Shield className="inline mr-1" size={16} />
                                Grant admin privileges
                            </label>
                        </div>

                        {/* Working Days Info */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-blue-800">
                                📅 Working Days: Monday to Saturday (6 days/week)
                            </p>
                            <p className="text-xs text-blue-600 mt-1">Sunday is off for all doctors</p>
                        </div>

                        {/* Working Hours */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="inline mr-1" size={16} />
                                Working Hours *
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        className="input-field"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        className="input-field"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Example: 9:00 AM - 11:00 AM or 2:00 PM - 5:00 PM
                            </p>
                        </div>

                        <button type="submit" className="btn-primary w-full" disabled={submitting}>
                            <UserPlus className="inline mr-2" size={20} />
                            {submitting ? 'Creating Account...' : 'Onboard Doctor'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default Onboarding;
