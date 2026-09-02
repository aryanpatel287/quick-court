import Checkbox from '@/components/Shared/Form/Checkbox/Checkbox';
import VerticalBadge from '@/components/Shared/DataDisplay/VerticalBadge/VerticalBadge';
import { isColumnMatchingSearch, highlightReactTree } from '../../utils/searchHighlightUtils';

function TableRow({
    row,
    rowIndex,
    serialNumber,
    showSerialNumber = false,
    selectable = false,
    isChecked = false,
    isEditing = false,
    selectedCount = 0,
    handleSelectRow,
    clearedNewRowIds,
    effectiveColumns = [],
    searchTerm = '',
    onRowFieldChange,
    onCellContextMenu,
}) {
    const handleRowClick = (e) => {
        // If user clicked an interactive control (input, button, link, checkbox container), let control handle it
        const isInteractive = e.target.closest(
            'button, input, a, select, textarea, label.checkbox-custom-container',
        );
        if (isInteractive) return;

        // Once user clicks at least 1 checkbox (selectedCount > 0), clicking anywhere on any row selects/deselects it
        if (selectedCount > 0 && selectable) {
            handleSelectRow(row.id);
        }
    };

    const handleCellContextMenu = (e, col) => {
        e.preventDefault();
        e.stopPropagation();
        if (onCellContextMenu) {
            onCellContextMenu(e, row, col);
        }
    };

    return (
        <tr
            key={row.id || rowIndex}
            className={`advanced-table-row ${isChecked ? 'row-selected' : ''} ${isEditing ? 'row-editing' : ''} ${selectedCount > 0 ? 'is-row-clickable' : ''}`}
            onClick={handleRowClick}
            onContextMenu={(e) => handleCellContextMenu(e, null)}
        >
            {selectable && (
                <td
                    className="advanced-table-body-cell checkbox-cell"
                    style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}
                >
                    <Checkbox
                        id={`advanced-row-${row.id || rowIndex}`}
                        checked={isChecked}
                        onChange={() => handleSelectRow(row.id)}
                    />
                </td>
            )}
            {showSerialNumber && (
                <td
                    className="advanced-table-body-cell serial-number-cell"
                    style={{
                        width: '56px',
                        minWidth: '56px',
                        maxWidth: '56px',
                        textAlign: 'center',
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                    }}
                >
                    {serialNumber}
                </td>
            )}
            <td className="advanced-table-body-cell badge-column-cell">
                {row.isNew && (!clearedNewRowIds || !clearedNewRowIds.has(row.id)) && (
                    <VerticalBadge text="New" variant="success" />
                )}
            </td>
            {effectiveColumns.map((col) => {
                const rawValue = row[col.key];
                const isEditableCell = isEditing && col.key !== 'actions' && col.key !== 'action';

                if (isEditableCell) {
                    return (
                        <td
                            key={col.key}
                            className={`advanced-table-body-cell cell-editing ${col.key}-cell ${col.className || ''}`}
                            onContextMenu={(e) => handleCellContextMenu(e, col)}
                        >
                            <input
                                type="text"
                                className="table-inline-edit-input"
                                value={
                                    rawValue !== undefined && rawValue !== null
                                        ? String(rawValue)
                                        : ''
                                }
                                onChange={(e) =>
                                    onRowFieldChange &&
                                    onRowFieldChange(row.id, col.key, e.target.value)
                                }
                            />
                        </td>
                    );
                }

                const rendered = col.render ? col.render(rawValue, row) : rawValue;
                const isMatch = isColumnMatchingSearch(row, col.key, searchTerm);

                return (
                    <td
                        key={col.key}
                        className={`advanced-table-body-cell ${col.key}-cell ${col.className || ''}`}
                        onContextMenu={(e) => handleCellContextMenu(e, col)}
                    >
                        {isMatch ? highlightReactTree(rendered, searchTerm) : rendered}
                    </td>
                );
            })}
        </tr>
    );
}

export default TableRow;
