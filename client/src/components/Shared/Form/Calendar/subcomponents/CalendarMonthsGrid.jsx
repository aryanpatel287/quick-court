const SHORT_MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

/**
 * Calendar Months Grid Subcomponent
 * Renders 12-month selector grid view when viewMode === 'months'.
 */
function CalendarMonthsGrid({ currentMonthIndex, activeYear, onMonthSelect }) {
    const today = new Date();

    return (
        <div className="calendar-months-grid">
            {SHORT_MONTH_NAMES.map((mName, idx) => {
                const isCurrentMonth =
                    today.getMonth() === idx && today.getFullYear() === activeYear;
                const isSelectedMonth = idx === currentMonthIndex;

                return (
                    <button
                        key={mName}
                        type="button"
                        className={`month-cell ${isSelectedMonth ? 'selected' : ''} ${isCurrentMonth ? 'current' : ''}`}
                        onClick={() => onMonthSelect(idx)}
                    >
                        {mName}
                    </button>
                );
            })}
        </div>
    );
}

export default CalendarMonthsGrid;
