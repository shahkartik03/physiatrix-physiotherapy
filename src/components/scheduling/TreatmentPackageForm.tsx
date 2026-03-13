import React, { useState, useEffect } from 'react';
import { Calendar, Package, DollarSign, User, Clock, AlertCircle } from 'lucide-react';
import { createTreatmentPackage, schedulePackageAppointments, convertAppointmentToPackage } from '../../services/packageService';
import { collection, getDocs, query, where, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { TreatmentPackage, PackageAppointmentSchedule } from '../../types';
import MultiDateSelector from '../common/MultiDateSelector';
import PaymentModeSelector from '../common/PaymentModeSelector';

interface TreatmentPackageFormProps {
  onSuccess?: (packageId: string) => void;
  onCancel?: () => void;
  preSelectedPatientId?: string;  // Optional pre-selected patient
  preSelectedPatientName?: string;
  sourceAppointmentId?: string;  // Optional appointment to convert to package
}

interface PatientOption {
  id: string;
  name: string;
  phone: string;
}

interface DoctorOption {
  id: string;
  name: string;
  specialty: string;
}

const TreatmentPackageForm: React.FC<TreatmentPackageFormProps> = ({ onSuccess, onCancel, preSelectedPatientId, preSelectedPatientName, sourceAppointmentId }) => {
  // Form state
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Package details
  const [selectedPatientId, setSelectedPatientId] = useState(preSelectedPatientId || '');
  const [packageName, setPackageName] = useState('');
  const [totalSessions, setTotalSessions] = useState<number>(10);
  const [treatmentType, setTreatmentType] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(5000);
  const [defaultDoctorId, setDefaultDoctorId] = useState('');
  const [defaultTime, setDefaultTime] = useState('10:00');
  const [expiryDate, setExpiryDate] = useState('');
  
  // Payment details
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  // Scheduling
  const [scheduleNow, setScheduleNow] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [timePerDate, setTimePerDate] = useState<Record<string, string>>({});
  const [doctorPerDate, setDoctorPerDate] = useState<Record<string, string>>({});
  const [sourceAppointmentDate, setSourceAppointmentDate] = useState<string | null>(null);

  // Computed values
  const pricePerSession = totalAmount / totalSessions;
  const amountPending = totalAmount - amountPaid;
  const isPartialPayment = amountPaid > 0 && amountPaid < totalAmount;

  // Fetch patients and doctors on mount
  useEffect(() => {
    fetchPatientsAndDoctors();
  }, []);

  // Fetch source appointment details when converting
  useEffect(() => {
    const fetchSourceAppointment = async () => {
      if (sourceAppointmentId) {
        try {
          const appointmentRef = doc(db, 'appointments', sourceAppointmentId);
          const appointmentDoc = await getDoc(appointmentRef);
          if (appointmentDoc.exists()) {
            const appointmentData = appointmentDoc.data();
            setSourceAppointmentDate(appointmentData.date);
            console.log('📅 Source appointment date:', appointmentData.date);
          }
        } catch (error) {
          console.error('Error fetching source appointment:', error);
        }
      }
    };
    fetchSourceAppointment();
  }, [sourceAppointmentId]);

  // Set logged-in doctor as default
  useEffect(() => {
    const loggedInUserId = localStorage.getItem('userId') || '';
    if (loggedInUserId && doctors.length > 0) {
      const loggedInDoctor = doctors.find(d => d.id === loggedInUserId);
      if (loggedInDoctor && !defaultDoctorId) {
        setDefaultDoctorId(loggedInUserId);
      }
    }
  }, [doctors]);

  // Auto-fill amount paid with total amount
  useEffect(() => {
    if (amountPaid === 0) {
      setAmountPaid(totalAmount);
    }
  }, [totalAmount]);

  // Update total amount when sessions change (maintain 500 per session default)
  useEffect(() => {
    setTotalAmount(totalSessions * 500);
  }, [totalSessions]);

  // Auto-generate dates when scheduleNow is checked or totalSessions changes
  useEffect(() => {
    if (scheduleNow) {
      // If converting an appointment, generate N-1 dates (original appointment is Session #1)
      const datesToGenerate = sourceAppointmentId ? totalSessions - 1 : totalSessions;
      const startDate = sourceAppointmentDate ? new Date(sourceAppointmentDate) : new Date();
      const autoDates = generateDatesExcludingSundays(datesToGenerate, startDate, sourceAppointmentDate);
      setSelectedDates(autoDates);
      
      // Set default time and doctor for all dates
      const timeMap: Record<string, string> = {};
      const doctorMap: Record<string, string> = {};
      autoDates.forEach(date => {
        timeMap[date] = defaultTime;
        doctorMap[date] = defaultDoctorId;
      });
      setTimePerDate(timeMap);
      setDoctorPerDate(doctorMap);
    }
  }, [scheduleNow, totalSessions, sourceAppointmentId, sourceAppointmentDate]);

  // Helper function to generate dates excluding Sundays
  const generateDatesExcludingSundays = (count: number, startDate: Date = new Date(), excludeDate: string | null = null): string[] => {
    const dates: string[] = [];
    let currentDate = new Date(startDate);
    
    // Start from the next day after startDate
    currentDate.setDate(currentDate.getDate() + 1);
    
    while (dates.length < count) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Skip Sundays (0 = Sunday) AND skip the excludeDate (original appointment date)
      if (currentDate.getDay() !== 0 && dateString !== excludeDate) {
        dates.push(dateString);
      }
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const fetchPatientsAndDoctors = async () => {
    try {
      // Fetch patients
      const patientsSnapshot = await getDocs(collection(db, 'patients'));
      const patientsList = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        phone: doc.data().phone,
      }));
      setPatients(patientsList);

      // Fetch doctors
      const doctorsQuery = query(collection(db, 'doctors'), where('isActive', '==', true));
      const doctorsSnapshot = await getDocs(doctorsQuery);
      const doctorsList = doctorsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        specialty: doc.data().specialty,
      }));
      setDoctors(doctorsList);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load patients and doctors');
    }
  };

  const handleAddDate = (date: string) => {
    // Prevent adding the source appointment date
    if (sourceAppointmentDate && date === sourceAppointmentDate) {
      alert(`Cannot select ${new Date(sourceAppointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - this is the original appointment date and will be Session #1.`);
      return;
    }
    setSelectedDates(prev => [...prev, date]);
    // Set default time and doctor for this date
    setTimePerDate(prev => ({ ...prev, [date]: defaultTime }));
    setDoctorPerDate(prev => ({ ...prev, [date]: defaultDoctorId }));
  };

  const handleRemoveDate = (date: string) => {
    setSelectedDates(prev => prev.filter(d => d !== date));
    // Remove time and doctor for this date
    setTimePerDate(prev => {
      const updated = { ...prev };
      delete updated[date];
      return updated;
    });
    setDoctorPerDate(prev => {
      const updated = { ...prev };
      delete updated[date];
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validations
      if (!selectedPatientId) {
        throw new Error('Please select a patient');
      }
      if (!packageName.trim()) {
        throw new Error('Please enter package name');
      }
      if (!treatmentType.trim()) {
        throw new Error('Please enter treatment type');
      }
      if (!defaultDoctorId) {
        throw new Error('Please select default doctor');
      }
      if (totalSessions < 1) {
        throw new Error('Total sessions must be at least 1');
      }
      if (totalAmount < 1) {
        throw new Error('Total amount must be at least 1');
      }
      if (amountPaid < 0 || amountPaid > totalAmount) {
        throw new Error('Invalid payment amount');
      }
      if (scheduleNow && selectedDates.length === 0) {
        throw new Error('Please select at least one date to schedule');
      }
      if (scheduleNow && selectedDates.length > totalSessions) {
        throw new Error(`Cannot schedule more than ${totalSessions} sessions`);
      }

      const selectedPatient = patients.find(p => p.id === selectedPatientId);
      const selectedDoctor = doctors.find(d => d.id === defaultDoctorId);

      if (!selectedPatient || !selectedDoctor) {
        throw new Error('Invalid patient or doctor selection');
      }

      // Get current user from localStorage
      const currentUserId = localStorage.getItem('userId') || '';
      
      console.log('📦 Creating package with data:', {
        patientId: selectedPatientId,
        patientName: selectedPatient.name,
        packageName: packageName.trim(),
        totalSessions,
        currentUserId,
        isAuthenticated: !!currentUserId,
        isPartialPayment,
        paymentMode
      });

      // Create package - preserve actual payment mode and track partial payment status
      const packageData: any = {
        patientId: selectedPatientId,
        patientName: selectedPatient.name,
        packageName: packageName.trim(),
        totalSessions,
        treatmentType: treatmentType.trim(),
        totalAmount,
        amountPaid,
        amountPending,
        pricePerSession,
        paymentMode: paymentMode,
        isPartialPayment: isPartialPayment,
        paymentDate: new Date().toISOString(),
        defaultDoctorId,
        defaultDoctorName: selectedDoctor.name,
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
        createdBy: currentUserId,
      };

      // Only add optional fields if they have values
      if (transactionId.trim()) {
        packageData.transactionId = transactionId.trim();
      }
      if (defaultTime) {
        packageData.defaultTime = defaultTime;
      }
      if (expiryDate) {
        packageData.expiryDate = expiryDate;
      }
      if (notes.trim()) {
        packageData.notes = notes.trim();
      }

      console.log('📦 Full package data:', packageData);
      let packageId: string | null = null;
      
      try {
        // Step 1: Create package
        packageId = await createTreatmentPackage(packageData);
        console.log('✅ Package created with ID:', packageId);

        // Step 2: Convert existing appointment to Session #1 if provided
        if (sourceAppointmentId) {
          const fullPackageData: TreatmentPackage = {
            id: packageId,
            ...packageData,
            completedSessions: 0,
            remainingSessions: packageData.totalSessions,
            appointmentIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          try {
            await convertAppointmentToPackage(sourceAppointmentId, packageId, fullPackageData);
            console.log('✅ Original appointment converted to Session #1');
          } catch (convertError: any) {
            console.error('❌ Failed to convert appointment:', convertError);
            throw new Error(`Failed to convert appointment to Session #1: ${convertError.message || convertError}`);
          }
        }

        // Step 3: Schedule additional appointments if requested
        if (scheduleNow && selectedDates.length > 0) {
          const appointments: PackageAppointmentSchedule[] = selectedDates.map(date => {
            const doctorId = doctorPerDate[date] || defaultDoctorId;
            const doctor = doctors.find(d => d.id === doctorId);
            
            return {
              date,
              time: timePerDate[date] || defaultTime,
              doctorId,
              doctorName: doctor?.name || selectedDoctor.name,
              notes: `Scheduled as part of ${packageName}`,
            };
          });

          try {
            await schedulePackageAppointments(packageId, appointments);
            console.log('✅ Additional appointments scheduled');
          } catch (scheduleError: any) {
            console.error('❌ Failed to schedule appointments:', scheduleError);
            throw new Error(`Failed to schedule appointments: ${scheduleError.message || scheduleError}`);
          }
        }
      } catch (stepError: any) {
        // Rollback: Delete the package if it was created but subsequent steps failed
        if (packageId) {
          console.log('🔄 Rolling back: Deleting package', packageId);
          try {
            await deleteDoc(doc(db, 'treatmentPackages', packageId));
            console.log('✅ Rollback successful: Package deleted');
          } catch (rollbackError) {
            console.error('❌ Rollback failed:', rollbackError);
            // Even if rollback fails, throw the original error
          }
        }
        // Re-throw the original error to be caught by outer catch block
        throw stepError;
      }

      // Success - packageId is guaranteed to be non-null here
      if (onSuccess && packageId) {
        onSuccess(packageId);
      }

      // Reset form or close
      const message = sourceAppointmentId 
        ? 'Appointment successfully converted to treatment package!' 
        : 'Treatment package created successfully!';
      alert(message);
    } catch (err: any) {
      console.error('❌ Error creating package:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
        fullError: err
      });
      
      let errorMessage = 'Failed to create package';
      
      // Provide specific error messages based on error type
      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firestore security rules for appointments collection.';
      } else if (err.code === 'not-found') {
        errorMessage = 'Appointment not found. It may have been deleted.';
      } else if (err.message) {
        // Use the detailed error message from our try-catch blocks
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}\n\nPlease check the console for more details or contact support.`);
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const defaultDoctor = doctors.find(d => d.id === defaultDoctorId);

  const today = new Date().toISOString().split('T')[0];
  
  // When converting appointment, minDate should be day after appointment date
  // Otherwise, use tomorrow
  const minDateForPicker = sourceAppointmentDate 
    ? (() => {
        const nextDay = new Date(sourceAppointmentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay.toISOString().split('T')[0];
      })()
    : (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      })();
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  const defaultExpiryDate = threeMonthsLater.toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Package className="text-teal-600" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Create Treatment Package</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {sourceAppointmentId && (
        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
          <div className="text-blue-800 text-sm">
            <p className="font-semibold mb-1">Converting Appointment to Package</p>
            <p>The selected appointment will become <strong>Session #1</strong> of this treatment package. Additional sessions can be scheduled below.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline mr-1" size={14} />
            Select Patient <span className="text-red-500">*</span>
          </label>
          {preSelectedPatientId && preSelectedPatientName ? (
            <div className="input-field bg-gray-100 flex items-center gap-2 font-semibold text-gray-700">
              <User size={16} className="text-teal-600" />
              {preSelectedPatientName}
            </div>
          ) : (
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">-- Select Patient --</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.phone})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Package Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Package Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            placeholder="e.g., Post Surgery Rehab - 20 Sessions"
            className="input-field"
            required
          />
        </div>

        {/* Treatment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Treatment Type <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={treatmentType}
            onChange={(e) => setTreatmentType(e.target.value)}
            placeholder="e.g., Physiotherapy, Rehabilitation"
            className="input-field"
            required
          />
        </div>

        {/* Sessions and Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Sessions <span className="text-red-500">*</span>
            </label>
            <select
              value={totalSessions}
              onChange={(e) => setTotalSessions(Number(e.target.value))}
              className="input-field"
              required
            >
              <option value={5}>5 Sessions</option>
              <option value={10}>10 Sessions</option>
              <option value={15}>15 Sessions</option>
              <option value={20}>20 Sessions</option>
              <option value={30}>30 Sessions</option>
            </select>
            {sourceAppointmentId && (
              <p className="text-xs text-blue-600 mt-1">
                ℹ️ Includes the original appointment as Session #1
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={totalAmount === 0 ? '' : totalAmount}
              onChange={(e) => setTotalAmount(e.target.value === '' ? 0 : Number(e.target.value))}
              min="1"
              className="input-field"
              placeholder="5000"
              required
            />
          </div>
        </div>

        {/* Doctor and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor <span className="text-red-500">*</span>
            </label>
            <select
              value={defaultDoctorId}
              onChange={(e) => setDefaultDoctorId(e.target.value)}
              className="input-field w-full"
              required
            >
              <option value="">Select Doctor</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialty}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline mr-1" size={14} />
              Time
            </label>
            <input
              type="time"
              value={defaultTime}
              onChange={(e) => setDefaultTime(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Payment Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign size={20} />
            Payment Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Paid <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={amountPaid === 0 ? '' : amountPaid}
                onChange={(e) => setAmountPaid(e.target.value === '' ? 0 : Number(e.target.value))}
                min="0"
                max={totalAmount}
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Balance: ₹{amountPending.toLocaleString()}
                {isPartialPayment && <span className="text-orange-600 font-semibold"> (Partial Payment)</span>}
              </p>
            </div>

            <div>
              <PaymentModeSelector
                selectedMode={paymentMode}
                onChange={setPaymentMode}
              />
            </div>
          </div>

          {paymentMode === 'upi' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction ID
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter UPI transaction ID"
                className="input-field"
              />
            </div>
          )}
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline mr-1" size={14} />
            Expiry Date (Optional)
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            min={today}
            placeholder={defaultExpiryDate}
            className="input-field"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty for no expiry, or select a date (default: 3 months)
          </p>
        </div>

        {/* Schedule Now Option */}
        <div className="border-t pt-6">
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={scheduleNow}
              onChange={(e) => setScheduleNow(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium text-gray-700">
              Schedule appointments now
            </span>
          </label>

          {scheduleNow && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Auto-generated dates:</strong> {sourceAppointmentId ? (
                  <>
                    {totalSessions - 1} additional appointment{totalSessions - 1 !== 1 ? 's' : ''} have been automatically scheduled starting from{' '}
                    <span className="font-semibold">{sourceAppointmentDate ? new Date(new Date(sourceAppointmentDate).getTime() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'tomorrow'}</span>
                    {' '}(excluding Sundays and the original appointment date). 
                    <span className="font-semibold"> The original appointment on {sourceAppointmentDate ? new Date(sourceAppointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} will become Session #1 of this {totalSessions}-session package.</span>
                  </>
                ) : (
                  <>
                    {totalSessions} appointments have been automatically scheduled (excluding Sundays).
                  </>
                )}
                {' '}All appointments are assigned to the logged-in doctor. You can edit individual appointment times and doctors below.
              </p>
            </div>
          )}

          {scheduleNow && (
            <div className="space-y-4">
              <MultiDateSelector
                selectedDates={selectedDates}
                onAddDate={handleAddDate}
                onRemoveDate={handleRemoveDate}
                minDate={minDateForPicker}
                label="Select Appointment Dates"
              />

              {selectedDates.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Customize Each Appointment:
                  </p>
                  {selectedDates.map(date => (
                    <div key={date} className="p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                        <input
                          type="text"
                          value={new Date(date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          className="input-field text-sm"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                        <input
                          type="time"
                          value={timePerDate[date] || defaultTime}
                          onChange={(e) => setTimePerDate(prev => ({ ...prev, [date]: e.target.value }))}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Doctor</label>
                        <select
                          value={doctorPerDate[date] || defaultDoctorId}
                          onChange={(e) => setDoctorPerDate(prev => ({ ...prev, [date]: e.target.value }))}
                          className="input-field text-sm"
                        >
                          {doctors.map(doctor => (
                            <option key={doctor.id} value={doctor.id}>
                              {doctor.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about this package..."
            className="input-field resize-none"
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Package...' : 'Create Package'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TreatmentPackageForm;
