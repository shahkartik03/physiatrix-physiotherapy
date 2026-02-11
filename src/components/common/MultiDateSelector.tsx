import React from 'react';
import { Calendar, X } from 'lucide-react';

interface MultiDateSelectorProps {
    selectedDates: string[];
    onAddDate: (date: string) => void;
    onRemoveDate: (date: string) => void;
    minDate?: string;
    label?: string;
    required?: boolean;
}

const MultiDateSelector: React.FC<MultiDateSelectorProps> = ({
    selectedDates,
    onAddDate,
    onRemoveDate,
    minDate,
    label = 'Select Appointment Dates',
    required = false
}) => {
    const [currentDate, setCurrentDate] = React.useState('');

    const handleAddClick = () => {
        if (currentDate && !selectedDates.includes(currentDate)) {
            onAddDate(currentDate);
            setCurrentDate('');
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline mr-1" size={14} />
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                <input
                    type="date"
                    value={currentDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                    className="input-field"
                    min={minDate}
                    placeholder="Select a date"
                />
                <button
                    type="button"
                    onClick={handleAddClick}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                    <Calendar size={18} />
                    Add Date
                </button>
            </div>
            
            {/* Selected Dates Display */}
            {selectedDates.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800 mb-2">
                        Selected Dates ({selectedDates.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {selectedDates.map(date => (
                            <div 
                                key={date} 
                                className="bg-white border border-green-300 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm"
                            >
                                <span className="text-gray-700 font-medium">
                                    {new Date(date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onRemoveDate(date)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiDateSelector;
