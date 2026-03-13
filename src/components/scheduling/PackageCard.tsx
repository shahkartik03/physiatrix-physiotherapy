import React from 'react';
import { Package, User, Calendar, DollarSign, Activity, Clock, AlertCircle } from 'lucide-react';
import type { TreatmentPackage } from '../../types';

interface PackageCardProps {
  package: TreatmentPackage;
  onScheduleNext?: (packageId: string) => void;
  onViewDetails?: (packageId: string) => void;
  onScheduleRemaining?: (packageId: string) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({
  package: pkg,
  onScheduleNext,
  onViewDetails,
  onScheduleRemaining,
}) => {
  const progressPercentage = (pkg.completedSessions / pkg.totalSessions) * 100;
  const isExpiringSoon = pkg.expiryDate && new Date(pkg.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const hasBalance = pkg.amountPending > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-teal-600 rounded-lg">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">{pkg.packageName}</h3>
              <p className="text-sm text-gray-600">{pkg.treatmentType}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(pkg.status)}`}>
            {pkg.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Patient Info */}
        <div className="flex items-center gap-2 text-sm">
          <User className="text-gray-500" size={16} />
          <span className="font-semibold text-gray-700">Patient:</span>
          <span className="text-gray-600">{pkg.patientName}</span>
        </div>

        {/* Default Doctor */}
        <div className="flex items-center gap-2 text-sm">
          <User className="text-gray-500" size={16} />
          <span className="font-semibold text-gray-700">Default Doctor:</span>
          <span className="text-gray-600">{pkg.defaultDoctorName}</span>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <Activity size={16} className="text-teal-600" />
              Progress
            </span>
            <span className="text-gray-600">
              {pkg.completedSessions} of {pkg.totalSessions} sessions
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-teal-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {pkg.remainingSessions} session{pkg.remainingSessions !== 1 ? 's' : ''} remaining
          </p>
        </div>

        {/* Payment Status */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <DollarSign size={16} className="text-green-600" />
              Payment Status
            </span>
            {hasBalance && (
              <span className="text-orange-600 font-semibold text-xs">Balance Due</span>
            )}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold text-gray-800">₹{pkg.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid:</span>
              <span className="font-semibold text-green-600">₹{pkg.amountPaid.toLocaleString()}</span>
            </div>
            {hasBalance && (
              <div className="flex justify-between">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-orange-600">₹{pkg.amountPending.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600 flex items-center gap-1 mb-1">
              <Calendar size={14} />
              Start Date
            </span>
            <p className="font-semibold text-gray-800">
              {new Date(pkg.startDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          {pkg.expiryDate && (
            <div>
              <span className="text-gray-600 flex items-center gap-1 mb-1">
                <Clock size={14} />
                Expiry Date
              </span>
              <p className={`font-semibold ${isExpiringSoon ? 'text-orange-600' : 'text-gray-800'}`}>
                {new Date(pkg.expiryDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Warnings */}
        {isExpiringSoon && pkg.status === 'active' && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-orange-600 flex-shrink-0" size={16} />
            <p className="text-xs text-orange-800">
              Package expires soon! Please complete remaining sessions before expiry.
            </p>
          </div>
        )}

        {hasBalance && pkg.status === 'active' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={16} />
            <p className="text-xs text-yellow-800">
              Balance payment of ₹{pkg.amountPending.toLocaleString()} is pending.
            </p>
          </div>
        )}

        {/* Notes */}
        {pkg.notes && (
          <div className="text-xs text-gray-600 italic border-t pt-3">
            <p className="line-clamp-2">{pkg.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {pkg.status === 'active' && pkg.remainingSessions > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {onScheduleNext && (
              <button
                onClick={() => onScheduleNext(pkg.id)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Schedule Next
              </button>
            )}
            {onScheduleRemaining && pkg.remainingSessions > 1 && (
              <button
                onClick={() => onScheduleRemaining(pkg.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Schedule All
              </button>
            )}
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(pkg.id)}
                className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      )}

      {pkg.status === 'completed' && (
        <div className="p-4 border-t border-gray-200 bg-green-50">
          <p className="text-sm text-green-800 font-semibold text-center flex items-center justify-center gap-2">
            <Activity size={16} />
            Package Completed Successfully
          </p>
        </div>
      )}
    </div>
  );
};

export default PackageCard;
