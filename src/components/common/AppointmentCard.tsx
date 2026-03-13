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
    onConvertToPackage?: (appointment: Appointment) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
    appointment,
    variant = 'full',
    showDoctor = false,
    showDate = false,
    showAction = true,
    onAction,
    actionLabel = 'Complete',
    onConvertToPackage,
}) => {
    // Compact variant - for schedule view (horizontal list-style)
    if (variant === 'compact') {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-accent-300 hover:shadow-md transition-all w-full min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="bg-accent-50 p-2 rounded-lg flex-shrink-0">
                            <User className="text-accent-600" size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">{appointment.patientName}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Clock size={12} className="text-gray-500 flex-shrink-0" />
                                <span className="font-semibold">{appointment.time}</span>
                            </div>
                        </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${
                        appointment.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        appointment.status === 'no-show' ? 'bg-red-100 text-red-700' :
                        appointment.status === 'scheduled' ? 'bg-orange-100 text-orange-700' :
                        appointment.status === 'cancelled' || appointment.status === 'canceled' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                        {appointment.status === 'completed' ? 'Done' : 
                         appointment.status === 'no-show' ? 'No-Show' :
                         appointment.status === 'scheduled' ? 'Scheduled' : 
                         appointment.status === 'cancelled' || appointment.status === 'canceled' ? 'Cancelled' : appointment.status}
                    </span>
                </div>
                <div className="border-t border-gray-100 pt-2">
                    <p className="text-xs text-gray-700 mb-1.5 font-medium truncate">{appointment.treatmentType}</p>
                    <div className="flex items-center justify-between gap-2">
                        {showDoctor && appointment.doctorName && (
                            <span className="text-xs text-blue-600 font-semibold truncate flex-1">{appointment.doctorName}</span>
                        )}
                        <p className="text-base font-bold text-gray-900 flex-shrink-0">₹{appointment.amount}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Minimal variant - for upcoming appointments (small cards)
    if (variant === 'minimal') {
        const formattedDate = appointment.date 
            ? new Date(appointment.date).toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
            : '';
        
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-2.5">
                    <div className="bg-blue-50 p-1.5 rounded flex-shrink-0">
                        <Calendar className="text-blue-500" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{appointment.patientName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            {showDate && formattedDate && <span>{formattedDate}</span>}
                            {showDate && formattedDate && <span>•</span>}
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
                            appointment.isPrePaid && appointment.status !== 'completed'
                                ? 'bg-blue-100 text-blue-700'
                                : appointment.isPaid 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-orange-100 text-orange-700'
                        }`}>
                            {appointment.isPrePaid && appointment.status !== 'completed' 
                                ? '💳 Pre-paid' 
                                : appointment.isPaid 
                                ? '✓ Paid' 
                                : 'Unpaid'}
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
                    {showAction && (
                        <div className="flex items-center gap-2">
                            {/* Show Convert to Package button for non-package scheduled appointments */}
                            {onConvertToPackage && !appointment.isPackageSession && 
                             (appointment.status === 'pending' || appointment.status === 'scheduled') && (
                                <button
                                    onClick={() => onConvertToPackage(appointment)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-all font-medium text-sm shadow-sm whitespace-nowrap"
                                >
                                    Package
                                </button>
                            )}
                            {/* Show Complete button */}
                            {onAction && (
                                ((!appointment.isPaid && (appointment.status === 'pending' || appointment.status === 'scheduled')) ||
                                 (appointment.isPrePaid && appointment.status !== 'completed')) && (
                                    <button
                                        onClick={() => onAction(appointment)}
                                        className="bg-green-500 hover:bg-accent-600 text-white px-3 py-1.5 rounded-lg transition-all font-medium text-sm shadow-sm whitespace-nowrap"
                                    >
                                        {appointment.isPrePaid ? 'Complete' : actionLabel}
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentCard;
