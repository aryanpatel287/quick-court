import ReactDOM from 'react-dom';
import Calendar from '@/components/Shared/Form/Calendar/Calendar';
import { parseStringToDate } from './dateUtils';

/**
 * DatePicker Popover Subcomponent
 * Renders dropdown panel containing <Calendar>, footer with "Today" button, and portal mounting.
 */
function DatePickerPopover({
    isOpen,
    disabled,
    portal,
    popoverPos,
    popoverRef,
    parsedDate,
    onSelectDate,
    viewDate,
    onViewDateChange,
    min,
    max,
    onTodayClick,
}) {
    if (!isOpen || disabled) return null;

    const content = (
        <div
            ref={popoverRef}
            className="datepicker-popover-dropdown"
            style={
                portal && popoverPos
                    ? {
                          position: 'fixed',
                          top: `${popoverPos.top}px`,
                          left: `${popoverPos.left}px`,
                          width: `${popoverPos.width}px`,
                          zIndex: popoverPos.zIndex,
                      }
                    : undefined
            }
        >
            <Calendar
                selectedDate={parsedDate}
                onSelectDate={onSelectDate}
                viewDate={viewDate}
                onViewDateChange={onViewDateChange}
                minDate={parseStringToDate(min)}
                maxDate={parseStringToDate(max)}
                showCard={false}
                eventDates={[]}
            />
            <div className="datepicker-popover-footer">
                <button type="button" className="datepicker-today-btn" onClick={onTodayClick}>
                    Today
                </button>
            </div>
        </div>
    );

    if (portal) {
        return popoverPos ? ReactDOM.createPortal(content, document.body) : null;
    }

    return content;
}

export default DatePickerPopover;
