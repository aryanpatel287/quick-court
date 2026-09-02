import {
    SlidersHorizontal as FilterPanelIcon,
    RotateCcw as ResetIcon,
    ChevronDown as ChevronDownIcon,
    CalendarDays as CalendarIcon,
    Hash as HashIcon,
    List as ListIcon,
} from 'lucide-react';
import DatePicker from '@/components/Shared/Form/DatePicker/DatePicker';
import InlineColumnFilter from '../InlineColumnFilter/InlineColumnFilter';
import './TableFilterPanel.scss';

function TableFilterPanel({
    filterPanelRef,
    effectiveFilterConfig = [],
    hasActiveFilters = false,
    clearAllFilters,
    expandedFilterKey,
    toggleFilterAccordion,
    columnFilters = {},
    setColumnFilters,
    dateRangeFilters = {},
    setDateRangeFilters,
    numericFilters = {},
    setNumericFilters,
    columnUniqueValues = {},
    onFilterValueChange,
}) {
    return (
        <div className="at-filter-panel" ref={filterPanelRef}>
            <div className="at-fp-header">
                <span className="at-fp-title">
                    <FilterPanelIcon size={14} />
                    Advanced Filters
                </span>
                {hasActiveFilters && (
                    <button type="button" className="at-fp-clear-all" onClick={clearAllFilters}>
                        <ResetIcon size={12} />
                        Clear all
                    </button>
                )}
            </div>

            <div className="at-fp-body">
                {effectiveFilterConfig.map((fc) => {
                    const isExpanded = expandedFilterKey === fc.key;

                    let hasValue = false;
                    let summaryText = 'All';

                    if (fc.type === 'select') {
                        const selected = columnFilters[fc.key] || [];
                        hasValue = selected.length > 0;
                        summaryText =
                            selected.length === 0
                                ? 'All'
                                : selected.length === 1
                                  ? selected[0]
                                  : `${selected.length} selected`;
                    } else if (fc.type === 'date') {
                        const range = dateRangeFilters[fc.key] || { from: null, to: null };
                        hasValue = !!(range.from || range.to);
                        if (range.from && range.to) summaryText = `${range.from} – ${range.to}`;
                        else if (range.from) summaryText = `From ${range.from}`;
                        else if (range.to) summaryText = `To ${range.to}`;
                        else summaryText = 'Any date';
                    } else if (fc.type === 'numeric') {
                        const range = numericFilters[fc.key] || { min: '', max: '' };
                        hasValue = range.min !== '' || range.max !== '';
                        if (range.min !== '' && range.max !== '')
                            summaryText = `${range.min} – ${range.max}`;
                        else if (range.min !== '') summaryText = `≥ ${range.min}`;
                        else if (range.max !== '') summaryText = `≤ ${range.max}`;
                        else summaryText = 'Any amount';
                    }

                    return (
                        <div
                            key={fc.key}
                            className={`at-fp-accordion-item ${isExpanded ? 'is-expanded' : ''} ${hasValue ? 'has-active-value' : ''}`}
                        >
                            <button
                                type="button"
                                className="at-fp-accordion-header"
                                onClick={() => toggleFilterAccordion(fc.key)}
                            >
                                <div className="at-fp-accordion-title">
                                    {fc.type === 'select' && <ListIcon size={14} />}
                                    {fc.type === 'date' && <CalendarIcon size={14} />}
                                    {fc.type === 'numeric' && <HashIcon size={14} />}
                                    <span>{fc.label}</span>
                                    {hasValue && <span className="at-fp-active-dot" />}
                                </div>
                                <div className="at-fp-accordion-right">
                                    <span
                                        className={`at-fp-summary-badge ${hasValue ? 'is-active' : ''}`}
                                    >
                                        {summaryText}
                                    </span>
                                    <ChevronDownIcon
                                        size={14}
                                        className={`at-fp-accordion-arrow ${isExpanded ? 'is-open' : ''}`}
                                    />
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="at-fp-accordion-content">
                                    {fc.type === 'select' && (
                                        <InlineColumnFilter
                                            column={fc}
                                            allValues={columnUniqueValues[fc.key] || []}
                                            selected={columnFilters[fc.key] || []}
                                            onChange={(vals) => {
                                                setColumnFilters((prev) => ({
                                                    ...prev,
                                                    [fc.key]: vals,
                                                }));
                                                if (onFilterValueChange) onFilterValueChange();
                                            }}
                                        />
                                    )}

                                    {fc.type === 'date' && (
                                        <div className="at-fp-date-row">
                                            <DatePicker
                                                value={(dateRangeFilters[fc.key] || {}).from || ''}
                                                onChange={(val) => {
                                                    setDateRangeFilters((prev) => ({
                                                        ...prev,
                                                        [fc.key]: { ...prev[fc.key], from: val },
                                                    }));
                                                    if (onFilterValueChange) onFilterValueChange();
                                                }}
                                                placeholder="From date"
                                                clearable={true}
                                                showSelectedValue={false}
                                                portal={true}
                                                align="left"
                                                className="at-fp-datepicker"
                                            />
                                            <span className="at-fp-date-sep" />
                                            <DatePicker
                                                value={(dateRangeFilters[fc.key] || {}).to || ''}
                                                onChange={(val) => {
                                                    setDateRangeFilters((prev) => ({
                                                        ...prev,
                                                        [fc.key]: { ...prev[fc.key], to: val },
                                                    }));
                                                    if (onFilterValueChange) onFilterValueChange();
                                                }}
                                                placeholder="To date"
                                                clearable={true}
                                                showSelectedValue={false}
                                                portal={true}
                                                align="right"
                                                className="at-fp-datepicker"
                                            />
                                        </div>
                                    )}

                                    {fc.type === 'numeric' && (
                                        <div className="at-fp-numeric-row">
                                            <div className="at-fp-numeric-field">
                                                <span className="at-fp-numeric-prefix">Min</span>
                                                <input
                                                    type="number"
                                                    className="at-fp-numeric-input"
                                                    placeholder="0"
                                                    value={(numericFilters[fc.key] || {}).min || ''}
                                                    onChange={(e) => {
                                                        setNumericFilters((prev) => ({
                                                            ...prev,
                                                            [fc.key]: {
                                                                ...prev[fc.key],
                                                                min: e.target.value,
                                                            },
                                                        }));
                                                        if (onFilterValueChange)
                                                            onFilterValueChange();
                                                    }}
                                                />
                                            </div>
                                            <span className="at-fp-numeric-sep" />
                                            <div className="at-fp-numeric-field">
                                                <span className="at-fp-numeric-prefix">Max</span>
                                                <input
                                                    type="number"
                                                    className="at-fp-numeric-input"
                                                    placeholder="∞"
                                                    value={(numericFilters[fc.key] || {}).max || ''}
                                                    onChange={(e) => {
                                                        setNumericFilters((prev) => ({
                                                            ...prev,
                                                            [fc.key]: {
                                                                ...prev[fc.key],
                                                                max: e.target.value,
                                                            },
                                                        }));
                                                        if (onFilterValueChange)
                                                            onFilterValueChange();
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TableFilterPanel;
