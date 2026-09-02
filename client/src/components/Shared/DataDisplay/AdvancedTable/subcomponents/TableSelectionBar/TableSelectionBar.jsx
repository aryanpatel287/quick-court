import { CornerDownRight, Pencil, Trash2, Check } from 'lucide-react';
import Tooltip from '@/components/Shared/DataDisplay/Tooltip/Tooltip';
import Button from '@/components/Shared/Buttons/Button/Button';
import TableExportMenu from '../TableExportMenu/TableExportMenu';
import './TableSelectionBar.scss';

function TableSelectionBar({
    selectedCount = 0,
    selectedData = [],
    columns = [],
    isEditingSelected = false,
    onToggleEditSelected,
    onDeleteSelected,
    onSaveEdits,
    onExportSelected,
}) {
    if (selectedCount === 0) return null;

    return (
        <div className="table-selection-bar">
            <div className="table-selection-bar-left">
                <CornerDownRight size={18} className="selection-arrow-icon" />
                <span className="selection-count-text">
                    {selectedCount} row{selectedCount > 1 ? 's' : ''} selected
                </span>
            </div>

            <div className="table-selection-bar-actions">
                <Tooltip
                    content={isEditingSelected ? 'Exit Edit Mode' : 'Edit Selected Rows'}
                    position="top"
                    usePortal
                >
                    <button
                        type="button"
                        className={`selection-action-btn ${isEditingSelected ? 'is-active' : ''}`}
                        onClick={onToggleEditSelected}
                        aria-label="Edit selected rows"
                    >
                        <Pencil size={16} />
                    </button>
                </Tooltip>

                <TableExportMenu
                    data={selectedData}
                    columns={columns}
                    buttonVariant="selection"
                    filenamePrefix="selected-table-rows"
                    reportTitle="Selected Table Rows Report"
                    onExport={onExportSelected}
                />

                <Tooltip content="Delete Selected" position="top" usePortal>
                    <button
                        type="button"
                        className="selection-action-btn danger-action"
                        onClick={onDeleteSelected}
                        aria-label="Delete selected rows"
                    >
                        <Trash2 size={16} />
                    </button>
                </Tooltip>

                {isEditingSelected && (
                    <Button type="button" variant="success" size="sm" onClick={onSaveEdits}>
                        <Check size={14} strokeWidth={2.5} />
                        <span>Save Changes</span>
                    </Button>
                )}
            </div>
        </div>
    );
}

export default TableSelectionBar;
