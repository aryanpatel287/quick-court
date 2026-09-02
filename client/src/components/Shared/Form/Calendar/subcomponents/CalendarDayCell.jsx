/**
 * Calendar Day Cell Subcomponent
 * Renders individual day button cell for active, sibling, today, selected, and event states.
 */
function CalendarDayCell({
    day,
    isSibling = false,
    isToday = false,
    isSelected = false,
    hasEvent = false,
    disabled = false,
    onClick,
    cellKey,
}) {
    if (isSibling) {
        return (
            <div key={cellKey} className="calendar-cell day-sibling">
                <span className="day-number">{day}</span>
            </div>
        );
    }

    return (
        <button
            key={cellKey}
            type="button"
            disabled={disabled}
            className={`calendar-cell day-active ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <span className="day-number">{day}</span>
            {hasEvent && <span className="event-dot"></span>}
        </button>
    );
}

export default CalendarDayCell;
