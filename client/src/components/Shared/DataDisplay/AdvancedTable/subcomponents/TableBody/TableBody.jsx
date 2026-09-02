import TableRow from '../TableRow/TableRow';
import TableSkeletonRows from '../TableSkeletonRows/TableSkeletonRows';
import TableEmptyState from '../TableEmptyState/TableEmptyState';
import './TableBody.scss';

function TableBody({
    loading = false,
    dynamicSkeletonCount = 5,
    paginatedData = [],
    selectedIds = [],
    isEditingSelected = false,
    handleSelectRow,
    clearedNewRowIds,
    effectiveColumns = [],
    selectable = false,
    showSerialNumber = false,
    safeCurrentPage = 1,
    rowsPerPage = 5,
    searchTerm = '',
    onRowFieldChange,
    onCellContextMenu,
}) {
    const colSpan = effectiveColumns.length + (selectable ? 1 : 0) + (showSerialNumber ? 1 : 0) + 1;

    return (
        <tbody>
            {loading ? (
                <TableSkeletonRows
                    dynamicSkeletonCount={dynamicSkeletonCount}
                    selectable={selectable}
                    showSerialNumber={showSerialNumber}
                    effectiveColumns={effectiveColumns}
                />
            ) : paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => {
                    const isChecked = selectedIds.includes(row.id);
                    const isEditing = isChecked && isEditingSelected;
                    const serialNumber = (safeCurrentPage - 1) * rowsPerPage + rowIndex + 1;

                    return (
                        <TableRow
                            key={row.id || rowIndex}
                            row={row}
                            rowIndex={rowIndex}
                            serialNumber={serialNumber}
                            showSerialNumber={showSerialNumber}
                            selectable={selectable}
                            isChecked={isChecked}
                            isEditing={isEditing}
                            selectedCount={selectedIds.length}
                            handleSelectRow={handleSelectRow}
                            clearedNewRowIds={clearedNewRowIds}
                            effectiveColumns={effectiveColumns}
                            searchTerm={searchTerm}
                            onRowFieldChange={onRowFieldChange}
                            onCellContextMenu={onCellContextMenu}
                        />
                    );
                })
            ) : (
                <TableEmptyState colSpan={colSpan} />
            )}
        </tbody>
    );
}

export default TableBody;
