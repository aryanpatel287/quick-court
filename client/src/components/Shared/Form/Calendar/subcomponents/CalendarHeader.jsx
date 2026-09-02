import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import Dropdown from '@/components/Shared/Form/Dropdown/Dropdown';

/**
 * Calendar Header Subcomponent
 * Renders Month selector button, searchable Year Dropdown, and Prev/Next arrow navigation.
 */
function CalendarHeader({
    year,
    month,
    monthName,
    viewMode,
    onToggleViewMode,
    yearOptions,
    onYearChange,
    onPrev,
    onNext,
}) {
    return (
        <div className="calendar-card-header">
            <div className="calendar-header-selectors">
                <button
                    type="button"
                    className={`calendar-selector-btn month-btn ${viewMode === 'months' ? 'active' : ''}`}
                    onClick={onToggleViewMode}
                    title="Click to toggle month grid"
                >
                    <span>{monthName}</span>
                    <ChevronDown size={13} className="selector-chevron" />
                </button>

                <Dropdown
                    options={yearOptions}
                    value={year}
                    onChange={onYearChange}
                    searchable={true}
                    className="calendar-header-year-dropdown"
                    maxHeight="220px"
                />
            </div>

            <div className="calendar-nav-actions">
                <button
                    type="button"
                    className="nav-arrow-btn"
                    onClick={onPrev}
                    aria-label="Previous"
                >
                    <ChevronLeft size={16} />
                </button>
                <button type="button" className="nav-arrow-btn" onClick={onNext} aria-label="Next">
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

export default CalendarHeader;
