import { CalendarDays as CalendarIcon, X as CloseIcon } from 'lucide-react';

/**
 * DatePicker Input Trigger Subcomponent
 * Renders label, value text/placeholder, clear action button, and calendar trigger icon.
 */
function DatePickerInput({
    label,
    displayString,
    placeholder,
    isOpen,
    disabled,
    clearable,
    onToggle,
    onClear,
}) {
    return (
        <>
            {label && <label className="datepicker-label">{label}</label>}

            <div
                className={`datepicker-input-wrapper ${isOpen ? 'is-open' : ''}`}
                onClick={() => !disabled && onToggle()}
                tabIndex={disabled ? -1 : 0}
                role="button"
                aria-expanded={isOpen}
            >
                <span className={`datepicker-value-text ${!displayString ? 'placeholder' : ''}`}>
                    {displayString || placeholder}
                </span>

                <div className="datepicker-actions">
                    {clearable && displayString && !disabled && (
                        <button
                            type="button"
                            className="datepicker-clear-btn"
                            onClick={onClear}
                            aria-label="Clear date"
                        >
                            <CloseIcon size={14} />
                        </button>
                    )}
                    <span className="datepicker-icon-trigger">
                        <CalendarIcon size={18} />
                    </span>
                </div>
            </div>
        </>
    );
}

export default DatePickerInput;
