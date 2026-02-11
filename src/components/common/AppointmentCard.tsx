import React from 'react';
import { User, Calendar, Clock } from 'lucide-react';
import { Appointment } from '../../mocks/appointments';

interface AppointmentCardProps {
    appointment: Appointment;
    variant?: 'compact' | 'full' | 'minimal';
    showDoctor?: boolean;
    showDate?: boolean;
    showAction?: boolean;
    onAction?: (appointment: Appointment) => void;
    actionLabel?: string;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
    appointment,
    variant = 'full',
    showDoctor = false,
    showDate = false,
    showAction = true,
    onAction,
    actionLabel = 'Complete',
}) => {
    // Compact variant - for schedule view (horizontal list-style)
    if (variant === 'compact') {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 hover:border-accent-300 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="bg-accent-50 p-1.5 rounded flex-shrink-0">
                            <User className="text-accent-600" size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 text-sm truncate">{appointment.patientName}</h3>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    appointment.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                    appointment.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {appointment.status === 'completed' ? 'Done' : 
                                     appointment.status === 'pending' ? 'Pending' : 'Cancelled'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                <span className="font-medium">{appointment.time}</span>
                                <span>•</span>
                                <span className="truncate">{appointment.treatmentType}</span>
                                {showDoctor && appointment.doctorName && (
                                    <>
                                        <span>•</span>
                                        <span className="text-blue-600 font-medium">{appointment.doctorName}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">₹{appointment.amount}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Minimal variant - for upcoming appointments (small cards)
    if (variant === 'minimal') {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-2.5">
                    <div className="bg-blue-50 p-1.5 rounded flex-shrink-0">
                        <Calendar className="text-blue-500" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{appointment.patientName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            {showDate && appointment.date && <span>{appointment.date}</span>}
                            {showDate && appointment.date && <span>•</span>}
                            <span>{appointment.time}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Full variant - for today's appointments (larger, action-focused cards)
    return (
        <div className="bg-gradient-to-r from-accent-50 to-white border-l-4 border-accent-500 rounded-lg p-3 hover:shadow-md transition-all">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="bg-white p-2 rounded-lg shadow-sm flex-shrink-0">
                        <User className="text-accent-600" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{appointment.patientName}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                            appointment.isPaid 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-orange-100 text-orange-700'
                        }`}>
                            {appointment.isPaid ? '✓ Paid' : 'Unpaid'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-medium">{appointment.time}</span>
                    <span>•</span>
                    <span className="truncate">{appointment.treatmentType}</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200">
                    <p className="text-lg font-bold text-gray-900">₹{appointment.amount}</p>
                    {showAction && !appointment.isPaid && appointment.status === 'pending' && onAction && (
                        <button
                            onClick={() => onAction(appointment)}
                            className="bg-accent-500 hover:bg-accent-600 text-white px-3 py-1.5 rounded-lg transition-all font-medium text-sm shadow-sm whitespace-nowrap"
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentCard;
