import { useState, useEffect, useRef, useCallback } from 'react';
import DatePickerInput from './subcomponents/DatePickerInput';
import DatePickerPopover from './subcomponents/DatePickerPopover';
import { formatDateToString, parseStringToDate } from './subcomponents/dateUtils';
import { useClickOutside } from '@/hooks/useClickOutside';
import './DatePicker.scss';

/**
 * Shared Modular DatePicker Component
 * Composes DatePickerInput and DatePickerPopover subcomponents.
 */
function DatePicker({
    value = '',
    onChange,
    label = '',
    placeholder = 'DD-MM-YYYY',
    showSelectedValue = true,
    selectedValuePrefix = 'Selected Value: ',
    disabled = false,
    error = '',
    min = null,
    max = null,
    clearable = true,
    portal = false,
    align = 'left',
    className = '',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [popoverPos, setPopoverPos] = useState(null);

    const parsedDate = parseStringToDate(value);
    const [viewDate, setViewDate] = useState(() => parsedDate || new Date());
    const containerRef = useRef(null);
    const popoverRef = useRef(null);

    useEffect(() => {
        const d = parseStringToDate(value);
        if (d) setViewDate(d);
    }, [value]);

    // Real-time position updating for portal mode
    const updatePosition = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const POPOVER_WIDTH = 245;

        let leftPos = rect.left;
        if (align === 'right') {
            leftPos = rect.right - POPOVER_WIDTH;
        }

        setPopoverPos({
            top: rect.bottom + 4,
            left: leftPos,
            width: POPOVER_WIDTH,
            zIndex: 99999,
        });
    }, [align]);

    useEffect(() => {
        if (!isOpen || !portal) return;

        updatePosition();

        const handleScroll = (e) => {
            if (popoverRef.current && popoverRef.current.contains(e.target)) return;
            setIsOpen(false);
        };
        const handleResize = () => {
            setIsOpen(false);
        };

        // capture: true catches scroll events from all scrollable parent containers
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen, portal, updatePosition]);

    // Click outside to close (supporting both inline & portal modes)
    useClickOutside([containerRef, popoverRef], () => setIsOpen(false), { enabled: isOpen });

    const handleSelectDate = (date) => {
        const formatted = formatDateToString(date);
        if (onChange) onChange(formatted, date);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (onChange) onChange('', null);
    };

    const handleTodayClick = () => {
        const today = new Date();
        handleSelectDate(today);
        setViewDate(today);
    };

    const displayString = parsedDate
        ? formatDateToString(parsedDate)
        : typeof value === 'string'
          ? value
          : '';

    return (
        <div
            className={`shared-datepicker-container ${disabled ? 'is-disabled' : ''} ${error ? 'has-error' : ''} ${className}`}
            ref={containerRef}
        >
            {/* 1. Input Trigger Subcomponent */}
            <DatePickerInput
                label={label}
                displayString={displayString}
                placeholder={placeholder}
                isOpen={isOpen}
                disabled={disabled}
                clearable={clearable}
                onToggle={() => setIsOpen(!isOpen)}
                onClear={handleClear}
            />

            {/* 2. Popover Dropdown Subcomponent */}
            <DatePickerPopover
                isOpen={isOpen}
                disabled={disabled}
                portal={portal}
                popoverPos={popoverPos}
                popoverRef={popoverRef}
                parsedDate={parsedDate}
                onSelectDate={handleSelectDate}
                viewDate={viewDate}
                onViewDateChange={setViewDate}
                min={min}
                max={max}
                onTodayClick={handleTodayClick}
            />

            {showSelectedValue && (
                <div className="datepicker-selected-info">
                    {selectedValuePrefix}
                    <strong>{displayString || 'None'}</strong>
                </div>
            )}

            {error && <span className="datepicker-error-msg">{error}</span>}
        </div>
    );
}

export default DatePicker;
