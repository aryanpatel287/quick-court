import CalendarDayCell from './CalendarDayCell';

const SHORT_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Calendar Days Grid Subcomponent
 * Renders weekday headers and month days cell matrix.
 */
function CalendarDaysGrid({
    year,
    month,
    daysInMonth,
    firstDayIndex,
    daysInPrevMonth,
    activeSelectedDate,
    eventDates = [],
    minDate,
    maxDate,
    onSelectDate,
}) {
    const isToday = (day) => {
        const today = new Date();
        return (
            today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
        );
    };

    const isSelected = (day) => {
        if (
            !activeSelectedDate ||
            !(activeSelectedDate instanceof Date) ||
            isNaN(activeSelectedDate.getTime())
        ) {
            return false;
        }
        return (
            activeSelectedDate.getDate() === day &&
            activeSelectedDate.getMonth() === month &&
            activeSelectedDate.getFullYear() === year
        );
    };

    const formatDateKey = (day) => {
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
    };

    const isDateDisabled = (day) => {
        const cellDate = new Date(year, month, day);
        if (minDate && cellDate < new Date(new Date(minDate).setHours(0, 0, 0, 0))) return true;
        if (maxDate && cellDate > new Date(new Date(maxDate).setHours(23, 59, 59, 999)))
            return true;
        return false;
    };

    // Prev month sibling cells
    const prevMonthCells = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        prevMonthCells.push(
            <CalendarDayCell
                key={`prev-${day}`}
                cellKey={`prev-${day}`}
                day={day}
                isSibling={true}
            />,
        );
    }

    // Current month active cells
    const currentMonthCells = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = formatDateKey(day);
        const hasEvent = Array.isArray(eventDates) && eventDates.includes(dateKey);
        const disabled = isDateDisabled(day);

        currentMonthCells.push(
            <CalendarDayCell
                key={`curr-${day}`}
                cellKey={`curr-${day}`}
                day={day}
                isToday={isToday(day)}
                isSelected={isSelected(day)}
                hasEvent={hasEvent}
                disabled={disabled}
                onClick={() => !disabled && onSelectDate(day)}
            />,
        );
    }

    // Next month sibling cells
    const totalCells = prevMonthCells.length + currentMonthCells.length;
    const nextMonthCells = [];
    const remainingCells = (totalCells > 35 ? 42 : 35) - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        nextMonthCells.push(
            <CalendarDayCell
                key={`next-${day}`}
                cellKey={`next-${day}`}
                day={day}
                isSibling={true}
            />,
        );
    }

    return (
        <>
            <div className="calendar-weekdays-grid">
                {SHORT_WEEKDAYS.map((day) => (
                    <div key={day} className="weekday-header-cell">
                        {day}
                    </div>
                ))}
            </div>

            <div className="calendar-days-grid">
                {prevMonthCells}
                {currentMonthCells}
                {nextMonthCells}
            </div>
        </>
    );
}

export default CalendarDaysGrid;
