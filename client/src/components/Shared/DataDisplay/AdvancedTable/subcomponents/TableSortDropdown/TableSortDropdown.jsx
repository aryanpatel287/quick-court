import { useMemo } from 'react';
import Dropdown from '@/components/Shared/Form/Dropdown/Dropdown';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { parseNumeric, parseDate } from '../../utils/tableUtils';
import './TableSortDropdown.scss';

function TableSortDropdown({
    columns = [],
    sortConfig = { key: null, direction: null },
    onSortChange,
    data = [],
}) {
    // Build sort options from effectiveColumns & data shape
    const sortOptions = useMemo(() => {
        const sortableColumns = columns.filter(
            (col) =>
                col.sortable !== false &&
                col.key !== 'action' &&
                col.key !== 'actions' &&
                col.key !== 'selection' &&
                col.key !== '_serialNumber' &&
                col.label,
        );

        const options = [];

        sortableColumns.forEach((col) => {
            // Detect column type from sample data
            let type = 'string';
            const sample = data.find(
                (row) =>
                    row[col.key] !== null &&
                    row[col.key] !== undefined &&
                    row[col.key] !== '-' &&
                    row[col.key] !== '',
            );

            if (sample) {
                const val = sample[col.key];
                if (typeof val === 'number' || parseNumeric(val) !== null) {
                    type = 'numeric';
                } else if (
                    parseDate(val) !== null &&
                    (String(val).includes('-') ||
                        String(val).includes(',') ||
                        String(val).includes('/'))
                ) {
                    type = 'date';
                }
            }

            let ascLabel = `${col.label} (A → Z)`;
            let descLabel = `${col.label} (Z → A)`;

            if (type === 'numeric') {
                ascLabel = `${col.label} (Low → High)`;
                descLabel = `${col.label} (High → Low)`;
            } else if (type === 'date') {
                ascLabel = `${col.label} (Oldest first)`;
                descLabel = `${col.label} (Newest first)`;
            }

            options.push({
                value: `${col.key}:asc`,
                label: ascLabel,
                direction: 'asc',
                columnLabel: col.label,
            });

            options.push({
                value: `${col.key}:desc`,
                label: descLabel,
                direction: 'desc',
                columnLabel: col.label,
            });
        });

        return options;
    }, [columns, data]);

    const currentValue = useMemo(() => {
        if (!sortConfig?.key || !sortConfig?.direction) return '';
        return `${sortConfig.key}:${sortConfig.direction}`;
    }, [sortConfig]);

    const handleChange = (val) => {
        if (!val) {
            onSortChange?.(null, null);
            return;
        }
        const [key, direction] = String(val).split(':');
        onSortChange?.(key, direction);
    };

    if (sortOptions.length === 0) return null;

    return (
        <div className="table-sort-dropdown-container">
            <Dropdown
                options={sortOptions}
                value={currentValue}
                onChange={handleChange}
                placeholder="Sort by"
                clearable={Boolean(currentValue)}
                className="table-sort-dropdown"
                renderOption={(option) => (
                    <div className="table-sort-option-item">
                        {option.direction === 'asc' ? (
                            <ArrowUp size={13} className="sort-dir-icon asc" />
                        ) : (
                            <ArrowDown size={13} className="sort-dir-icon desc" />
                        )}
                        <span className="sort-dir-label">{option.label}</span>
                    </div>
                )}
            />
        </div>
    );
}

export default TableSortDropdown;
