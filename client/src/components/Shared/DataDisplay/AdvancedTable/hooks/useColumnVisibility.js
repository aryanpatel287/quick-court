import { useState, useMemo, useCallback, useRef } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';

/**
 * Custom hook to manage column visibility (hide / show columns) in AdvancedTable
 */
export function useColumnVisibility({
    effectiveColumns = [],
    defaultHiddenColumns = [],
    controlledVisibleColumns = null,
    onColumnVisibilityChange,
}) {
    const [columnToggleOpen, setColumnToggleOpen] = useState(false);
    const [columnSearchTerm, setColumnSearchTerm] = useState('');
    const columnToggleRef = useRef(null);
    const columnToggleBtnRef = useRef(null);

    // Internal state of hidden column keys
    const [hiddenKeys, setHiddenKeys] = useState(() => {
        if (Array.isArray(defaultHiddenColumns) && defaultHiddenColumns.length > 0) {
            return new Set(defaultHiddenColumns);
        }
        return new Set();
    });

    // Synchronize when controlledVisibleColumns is provided
    const effectiveHiddenKeys = useMemo(() => {
        if (Array.isArray(controlledVisibleColumns)) {
            const visibleSet = new Set(controlledVisibleColumns);
            const hidden = new Set();
            effectiveColumns.forEach((col) => {
                if (!visibleSet.has(col.key)) {
                    hidden.add(col.key);
                }
            });
            return hidden;
        }
        return hiddenKeys;
    }, [controlledVisibleColumns, effectiveColumns, hiddenKeys]);

    // Derive visible columns list
    const visibleColumns = useMemo(() => {
        return effectiveColumns.filter((col) => !effectiveHiddenKeys.has(col.key));
    }, [effectiveColumns, effectiveHiddenKeys]);

    const notifyChange = useCallback(
        (newHiddenSet) => {
            if (onColumnVisibilityChange) {
                const visibleKeys = effectiveColumns
                    .map((c) => c.key)
                    .filter((k) => !newHiddenSet.has(k));
                const hiddenKeysArr = Array.from(newHiddenSet);
                onColumnVisibilityChange(visibleKeys, hiddenKeysArr);
            }
        },
        [effectiveColumns, onColumnVisibilityChange],
    );

    // Toggle single column
    const toggleColumn = useCallback(
        (colKey) => {
            const targetCol = effectiveColumns.find((c) => c.key === colKey);
            if (targetCol && (targetCol.hidable === false || targetCol.hideable === false)) {
                return; // Non-hideable column
            }

            setHiddenKeys((prev) => {
                const next = new Set(prev);
                if (next.has(colKey)) {
                    next.delete(colKey);
                } else {
                    // Prevent hiding ALL columns if at least 1 hidable column should stay visible
                    const hidableColumns = effectiveColumns.filter(
                        (c) => c.hidable !== false && c.hideable !== false,
                    );
                    const currentlyVisibleHidableCount = hidableColumns.filter(
                        (c) => !next.has(c.key),
                    ).length;
                    if (currentlyVisibleHidableCount <= 1) {
                        return prev;
                    }
                    next.add(colKey);
                }
                notifyChange(next);
                return next;
            });
        },
        [effectiveColumns, notifyChange],
    );

    // Show all columns
    const showAllColumns = useCallback(() => {
        const next = new Set();
        setHiddenKeys(next);
        notifyChange(next);
    }, [notifyChange]);

    // Reset to default hidden columns
    const resetColumns = useCallback(() => {
        const next = new Set(Array.isArray(defaultHiddenColumns) ? defaultHiddenColumns : []);
        setHiddenKeys(next);
        notifyChange(next);
    }, [defaultHiddenColumns, notifyChange]);

    // Click outside to close column toggle popover
    useClickOutside([columnToggleRef, columnToggleBtnRef], () => setColumnToggleOpen(false), {
        enabled: columnToggleOpen,
    });

    return {
        visibleColumns,
        hiddenKeys: effectiveHiddenKeys,
        columnToggleOpen,
        setColumnToggleOpen,
        columnSearchTerm,
        setColumnSearchTerm,
        columnToggleRef,
        columnToggleBtnRef,
        toggleColumn,
        showAllColumns,
        resetColumns,
    };
}
