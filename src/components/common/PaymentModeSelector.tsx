import React from 'react';
import { Wallet, DollarSign } from 'lucide-react';

interface PaymentModeSelectorProps {
    selectedMode: 'cash' | 'upi';
    onChange: (mode: 'cash' | 'upi') => void;
}

const PaymentModeSelector: React.FC<PaymentModeSelectorProps> = ({ selectedMode, onChange }) => {
    const buttonStyle = (isSelected: boolean) => ({
        backgroundColor: isSelected ? '#2563eb' : '#ffffff',
        borderColor: isSelected ? '#2563eb' : '#d1d5db',
        color: isSelected ? '#ffffff' : '#374151'
    });

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => onChange('cash')}
                    style={buttonStyle(selectedMode === 'cash')}
                    className="py-2.5 px-4 rounded-lg border-2 transition-colors font-medium inline-flex items-center justify-center"
                >
                    <Wallet 
                        size={18} 
                        className="mr-2 flex-shrink-0" 
                        style={{ color: selectedMode === 'cash' ? '#ffffff' : '#374151' }} 
                    />
                    <span style={{ color: selectedMode === 'cash' ? '#ffffff' : '#374151' }}>Cash</span>
                </button>
                <button
                    type="button"
                    onClick={() => onChange('upi')}
                    style={buttonStyle(selectedMode === 'upi')}
                    className="py-2.5 px-4 rounded-lg border-2 transition-colors font-medium inline-flex items-center justify-center"
                >
                    <DollarSign 
                        size={18} 
                        className="mr-2 flex-shrink-0" 
                        style={{ color: selectedMode === 'upi' ? '#ffffff' : '#374151' }} 
                    />
                    <span style={{ color: selectedMode === 'upi' ? '#ffffff' : '#374151' }}>UPI</span>
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                Selected: <span className="font-semibold">{selectedMode.toUpperCase()}</span>
            </p>
        </div>
    );
};

export default PaymentModeSelector;
