import {
    Columns3 as ColumnsIcon,
    RotateCcw as ResetIcon,
    Search as SearchIcon,
    Lock as LockIcon,
    Eye as EyeIcon,
    EyeOff as EyeOffIcon,
} from 'lucide-react';
import Checkbox from '@/components/Shared/Form/Checkbox/Checkbox';
import Tooltip from '../../../Tooltip/Tooltip';
import EmptyState from '@/components/Shared/DataDisplay/EmptyState/EmptyState';
import './TableColumnToggle.scss';

function TableColumnToggle({
    effectiveColumns = [],
    hiddenKeys = new Set(),
    columnToggleOpen = false,
    setColumnToggleOpen,
    columnSearchTerm = '',
    setColumnSearchTerm,
    columnToggleRef,
    columnToggleBtnRef,
    toggleColumn,
    showAllColumns,
    resetColumns,
}) {
    const hiddenCount = hiddenKeys.size;
    const totalCount = effectiveColumns.length;
    const visibleCount = totalCount - hiddenCount;

    const filteredColumns = effectiveColumns.filter((col) => {
        if (!columnSearchTerm.trim()) return true;
        const term = columnSearchTerm.toLowerCase();
        return (
            (col.label && String(col.label).toLowerCase().includes(term)) ||
            (col.key && String(col.key).toLowerCase().includes(term))
        );
    });

    const hasHidden = hiddenCount > 0;

    return (
        <div className="at-column-toggle-wrapper">
            <Tooltip
                content={hasHidden ? `Manage columns (${hiddenCount} hidden)` : 'Manage columns'}
                position="bottom"
            >
                <button
                    ref={columnToggleBtnRef}
                    type="button"
                    className={`at-column-toggle-btn ${columnToggleOpen ? 'is-open' : ''} ${hasHidden ? 'has-hidden' : 'icon-only'}`}
                    onClick={() => setColumnToggleOpen((prev) => !prev)}
                    aria-label="Manage column visibility"
                >
                    <ColumnsIcon size={14} />
                    {hasHidden && <span className="at-column-badge">{hiddenCount}</span>}
                </button>
            </Tooltip>

            {columnToggleOpen && (
                <div className="at-column-toggle-panel" ref={columnToggleRef}>
                    {/* Header */}
                    <div className="at-ct-header">
                        <div className="at-ct-title-group">
                            <span className="at-ct-title">
                                <ColumnsIcon size={14} />
                                Columns
                            </span>
                            <span className="at-ct-count-chip">
                                {visibleCount} visible, {hiddenCount} hidden
                            </span>
                        </div>
                        <div className="at-ct-header-actions">
                            {hiddenCount > 0 && (
                                <button
                                    type="button"
                                    className="at-ct-action-btn"
                                    onClick={showAllColumns}
                                >
                                    Show all
                                </button>
                            )}
                            <button
                                type="button"
                                className="at-ct-action-btn reset"
                                onClick={resetColumns}
                                title="Reset default column layout"
                            >
                                <ResetIcon size={12} />
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Search box if more than 4 columns */}
                    {totalCount > 4 && (
                        <div className="at-ct-search-box">
                            <SearchIcon size={13} className="at-ct-search-icon" />
                            <input
                                type="text"
                                className="at-ct-search-input"
                                placeholder="Filter columns..."
                                value={columnSearchTerm}
                                onChange={(e) => setColumnSearchTerm(e.target.value)}
                            />
                            {columnSearchTerm && (
                                <button
                                    type="button"
                                    className="at-ct-search-clear"
                                    onClick={() => setColumnSearchTerm('')}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    )}

                    {/* Column checklist */}
                    <div className="at-ct-list">
                        {filteredColumns.length > 0 ? (
                            filteredColumns.map((col) => {
                                const isHidden = hiddenKeys.has(col.key);
                                const isLocked =
                                    col.collapsible === false ||
                                    col.hidable === false ||
                                    col.hideable === false;

                                return (
                                    <div
                                        key={col.key}
                                        className={`at-ct-item ${isHidden ? 'is-hidden' : 'is-visible'} ${isLocked ? 'is-locked' : ''}`}
                                        onClick={() => !isLocked && toggleColumn(col.key)}
                                    >
                                        <div
                                            className="at-ct-item-checkbox"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Checkbox
                                                id={`at-col-toggle-${col.key}`}
                                                checked={!isHidden}
                                                disabled={isLocked}
                                                onChange={() => !isLocked && toggleColumn(col.key)}
                                            />
                                        </div>
                                        <label
                                            htmlFor={`at-col-toggle-${col.key}`}
                                            className="at-ct-item-label"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="at-ct-item-name">
                                                {col.label || col.key}
                                            </span>
                                        </label>
                                        <div className="at-ct-item-status">
                                            {isLocked ? (
                                                <span
                                                    className="at-ct-lock-icon"
                                                    title="Required column (cannot hide)"
                                                >
                                                    <LockIcon size={12} />
                                                </span>
                                            ) : (
                                                <span
                                                    className={`at-ct-collapse-badge ${isHidden ? 'collapsed' : 'expanded'}`}
                                                >
                                                    {isHidden ? (
                                                        <>
                                                            <EyeOffIcon size={12} />
                                                            Hidden
                                                        </>
                                                    ) : (
                                                        <>
                                                            <EyeIcon size={12} />
                                                            Visible
                                                        </>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <EmptyState variant="minimal" title="No matching columns" size="sm" />
                        )}
                    </div>

                    {/* Footer info */}
                    <div className="at-ct-footer">
                        <span className="at-ct-footer-hint">
                            {hiddenCount === 0
                                ? 'All columns visible'
                                : `${hiddenCount} column${hiddenCount > 1 ? 's' : ''} hidden`}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TableColumnToggle;
