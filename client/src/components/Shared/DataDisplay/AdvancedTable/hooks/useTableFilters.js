import { useState, useMemo, useRef } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';

export function useTableFilters({ effectiveFilterConfig = [], onFilterChange }) {
    const [filterPanelOpen, setFilterPanelOpen] = useState(false);
    const [columnFilters, setColumnFilters] = useState({});
    const [dateRangeFilters, setDateRangeFilters] = useState({});
    const [numericFilters, setNumericFilters] = useState({});
    const [expandedFilterKey, setExpandedFilterKey] = useState(null);
    const [openColDropdown, setOpenColDropdown] = useState(null);

    const filterPanelRef = useRef(null);
    const filterToggleRef = useRef(null);

    const toggleFilterAccordion = (key) => {
        setExpandedFilterKey((prev) => (prev === key ? null : key));
    };

    const clearAllFilters = () => {
        setColumnFilters({});
        setDateRangeFilters({});
        setNumericFilters({});
        if (onFilterChange) onFilterChange();
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        Object.values(columnFilters).forEach((arr) => {
            if (arr && arr.length > 0) count++;
        });
        Object.values(dateRangeFilters).forEach((r) => {
            if (r && (r.from || r.to)) count++;
        });
        Object.values(numericFilters).forEach((r) => {
            if (r && (r.min !== '' || r.max !== '')) count++;
        });
        return count;
    }, [columnFilters, dateRangeFilters, numericFilters]);

    const hasActiveFilters = activeFilterCount > 0;

    const activeChips = useMemo(() => {
        const chips = [];
        // column multi-select
        Object.entries(columnFilters).forEach(([key, vals]) => {
            if (vals && vals.length > 0) {
                const fc = effectiveFilterConfig.find((f) => f.key === key);
                const label = fc?.label || key;
                chips.push({
                    id: `col-${key}`,
                    label: `${label}: ${vals.join(', ')}`,
                    onRemove: () => {
                        setColumnFilters((prev) => ({ ...prev, [key]: [] }));
                        if (onFilterChange) onFilterChange();
                    },
                });
            }
        });
        // date range
        Object.entries(dateRangeFilters).forEach(([key, range]) => {
            if (range && (range.from || range.to)) {
                const fc = effectiveFilterConfig.find((f) => f.key === key);
                const label = fc?.label || key;
                const parts = [];
                if (range.from) parts.push(`from ${range.from}`);
                if (range.to) parts.push(`to ${range.to}`);
                chips.push({
                    id: `date-${key}`,
                    label: `${label}: ${parts.join(' ')}`,
                    onRemove: () => {
                        setDateRangeFilters((prev) => ({
                            ...prev,
                            [key]: { from: null, to: null },
                        }));
                        if (onFilterChange) onFilterChange();
                    },
                });
            }
        });
        // numeric range
        Object.entries(numericFilters).forEach(([key, range]) => {
            if (range && (range.min !== '' || range.max !== '')) {
                const fc = effectiveFilterConfig.find((f) => f.key === key);
                const label = fc?.label || key;
                const parts = [];
                if (range.min !== '') parts.push(`≥ ${range.min}`);
                if (range.max !== '') parts.push(`≤ ${range.max}`);
                chips.push({
                    id: `num-${key}`,
                    label: `${label}: ${parts.join(' ')}`,
                    onRemove: () => {
                        setNumericFilters((prev) => ({ ...prev, [key]: { min: '', max: '' } }));
                        if (onFilterChange) onFilterChange();
                    },
                });
            }
        });
        return chips;
    }, [columnFilters, dateRangeFilters, numericFilters, effectiveFilterConfig, onFilterChange]);

    // Filter panel close on outside click
    useClickOutside(
        [filterPanelRef, filterToggleRef],
        () => {
            setFilterPanelOpen(false);
            setOpenColDropdown(null);
        },
        {
            enabled: filterPanelOpen,
            ignoreCondition: (e) => Boolean(e.target.closest('.datepicker-popover-dropdown')),
        },
    );

    return {
        filterPanelOpen,
        setFilterPanelOpen,
        columnFilters,
        setColumnFilters,
        dateRangeFilters,
        setDateRangeFilters,
        numericFilters,
        setNumericFilters,
        expandedFilterKey,
        setExpandedFilterKey,
        openColDropdown,
        setOpenColDropdown,
        filterPanelRef,
        filterToggleRef,
        toggleFilterAccordion,
        clearAllFilters,
        activeFilterCount,
        hasActiveFilters,
        activeChips,
    };
}
