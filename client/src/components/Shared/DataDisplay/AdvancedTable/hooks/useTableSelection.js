import { useState, useCallback } from 'react';

export function useTableSelection({ selectedRows = [], onSelectedRowsChange, paginatedData = [] }) {
    const [internalSelectedIds, setInternalSelectedIds] = useState([]);
    const isControlledSelection = onSelectedRowsChange !== undefined;
    const selectedIds = isControlledSelection ? selectedRows : internalSelectedIds;

    const handleSelectRow = useCallback(
        (id) => {
            const nextSelectedIds = selectedIds.includes(id)
                ? selectedIds.filter((x) => x !== id)
                : [...selectedIds, id];
            if (isControlledSelection) onSelectedRowsChange(nextSelectedIds);
            else setInternalSelectedIds(nextSelectedIds);
        },
        [selectedIds, isControlledSelection, onSelectedRowsChange],
    );

    const handleSelectAll = useCallback(
        (e) => {
            const nextSelectedIds = e.target.checked ? paginatedData.map((rec) => rec.id) : [];
            if (isControlledSelection) onSelectedRowsChange(nextSelectedIds);
            else setInternalSelectedIds(nextSelectedIds);
        },
        [paginatedData, isControlledSelection, onSelectedRowsChange],
    );

    const isAllPageRowsSelected =
        paginatedData.length > 0 && paginatedData.every((rec) => selectedIds.includes(rec.id));

    return {
        selectedIds,
        handleSelectRow,
        handleSelectAll,
        isAllPageRowsSelected,
    };
}
