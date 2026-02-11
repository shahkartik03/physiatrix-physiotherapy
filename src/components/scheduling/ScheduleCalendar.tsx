import React from 'react';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const ScheduleCalendar: React.FC = () => {
    const [date, setDate] = React.useState<Date | null>(new Date());

    const handleDateChange = (newDate: Date) => {
        setDate(newDate);
        // Additional logic for fetching available time slots can be added here
    };

    return (
        <div className="schedule-calendar">
            <h2>Select a Date</h2>
            <Calendar
                onChange={handleDateChange}
                value={date}
                className="calendar"
            />
            {/* Render available time slots based on the selected date */}
        </div>
    );
};

export default ScheduleCalendar;