import { useState } from 'react';
import CalendarHeader from './subcomponents/CalendarHeader';
import CalendarDaysGrid from './subcomponents/CalendarDaysGrid';
import CalendarMonthsGrid from './subcomponents/CalendarMonthsGrid';
import './Calendar.scss';

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

/**
 * Shared Modular Calendar Component
 * Composes CalendarHeader, CalendarDaysGrid, and CalendarMonthsGrid subcomponents.
 */
function Calendar({
    selectedDate = null,
    onSelectDate,
    viewDate = null,
    onViewDateChange,
    eventDates = ['2026-07-16', '2026-07-22'],
    minDate = null,
    maxDate = null,
    showCard = true,
    className = '',
}) {
    // Controlled or internal state fallback
    const [internalViewDate, setInternalViewDate] = useState(
        () => selectedDate || viewDate || new Date(),
    );
    const [internalSelectedDate, setInternalSelectedDate] = useState(() => selectedDate || null);
    const [viewMode, setViewMode] = useState('days'); // 'days' | 'months'

    const activeViewDate = viewDate || internalViewDate;
    const activeSelectedDate =
        selectedDate !== undefined && selectedDate !== null ? selectedDate : internalSelectedDate;

    const year = activeViewDate.getFullYear();
    const month = activeViewDate.getMonth();

    const updateViewDate = (newDate) => {
        if (onViewDateChange) onViewDateChange(newDate);
        else setInternalViewDate(newDate);
    };

    const handlePrev = (e) => {
        if (e) e.stopPropagation();
        if (viewMode === 'days') {
            updateViewDate(new Date(year, month - 1, 1));
        } else if (viewMode === 'months') {
            updateViewDate(new Date(year - 1, month, 1));
        }
    };

    const handleNext = (e) => {
        if (e) e.stopPropagation();
        if (viewMode === 'days') {
            updateViewDate(new Date(year, month + 1, 1));
        } else if (viewMode === 'months') {
            updateViewDate(new Date(year + 1, month, 1));
        }
    };

    const handleMonthSelect = (mIndex) => {
        updateViewDate(new Date(year, mIndex, 1));
        setViewMode('days');
    };

    const handleDateClick = (day) => {
        const chosen = new Date(year, month, day);
        if (onSelectDate) {
            onSelectDate(chosen);
        } else {
            setInternalSelectedDate(chosen);
        }
    };

    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
    const getDaysInPrevMonth = (y, m) => new Date(y, m, 0).getDate();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInPrevMonth(year, month);

    // Generate year dropdown options (1940 to 2060)
    const minYear = minDate ? new Date(minDate).getFullYear() : 1940;
    const maxYear = maxDate ? new Date(maxDate).getFullYear() : 2060;
    const yearOptions = [];
    for (let y = maxYear; y >= minYear; y--) {
        yearOptions.push(y);
    }

    const content = (
        <div className={`calendar-body-content ${className}`}>
            {/* 1. Calendar Header Subcomponent */}
            <CalendarHeader
                year={year}
                month={month}
                monthName={MONTH_NAMES[month]}
                viewMode={viewMode}
                onToggleViewMode={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                yearOptions={yearOptions}
                onYearChange={(selectedYear) => {
                    if (selectedYear) {
                        updateViewDate(new Date(Number(selectedYear), month, 1));
                    }
                }}
                onPrev={handlePrev}
                onNext={handleNext}
            />

            {/* 2. Days View Grid Subcomponent */}
            {viewMode === 'days' && (
                <CalendarDaysGrid
                    year={year}
                    month={month}
                    daysInMonth={daysInMonth}
                    firstDayIndex={firstDayIndex}
                    daysInPrevMonth={daysInPrevMonth}
                    activeSelectedDate={activeSelectedDate}
                    eventDates={eventDates}
                    minDate={minDate}
                    maxDate={maxDate}
                    onSelectDate={handleDateClick}
                />
            )}

            {/* 3. Months View Grid Subcomponent */}
            {viewMode === 'months' && (
                <CalendarMonthsGrid
                    currentMonthIndex={month}
                    activeYear={year}
                    onMonthSelect={handleMonthSelect}
                />
            )}
        </div>
    );

    if (!showCard) {
        return content;
    }

    return (
        <div className="calendar-component-wrapper">
            <div className="calendar-section-card">{content}</div>
        </div>
    );
}

export default Calendar;
