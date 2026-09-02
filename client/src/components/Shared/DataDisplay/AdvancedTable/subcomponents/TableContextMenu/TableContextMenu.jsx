import { useEffect, useRef } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Copy, FileSpreadsheet, FileCode, Table as TableIcon } from 'lucide-react';
import { copyCellValue, copyRowTsv, copyRowCsv, copyRowJson } from '../../utils/tableCopyUtils';
import './TableContextMenu.scss';

/**
 * TableContextMenu
 * Custom context menu triggered on right-clicking any table cell or row.
 * Uses modular copy functions from tableCopyUtils.
 */
function TableContextMenu({
    x = 0,
    y = 0,
    row = null,
    col = null,
    effectiveColumns = [],
    onClose,
    onToast,
}) {
    const menuRef = useRef(null);

    // Close context menu on click outside
    useClickOutside(menuRef, () => onClose && onClose(), { enabled: Boolean(row) });

    // Close context menu on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose && onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!row) return null;

    // Wrap utility calls to auto-close menu
    const executeCopy = (copyFn) => {
        copyFn();
        onClose && onClose();
    };

    // Calculate cell value display
    const getCellValue = () => {
        if (!col) return '';
        const raw = row[col.key];
        if (raw === undefined || raw === null) return '';
        return String(raw);
    };

    // Adjust menu coordinates so it doesn't go offscreen
    const menuWidth = 210;
    const menuHeight = 180;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

    const cellVal = getCellValue();
    const colLabel = col?.label || col?.key;

    return (
        <div
            ref={menuRef}
            className="at-context-menu"
            style={{
                left: `${adjustedX}px`,
                top: `${adjustedY}px`,
            }}
        >
            {col && (
                <div className="at-context-menu-header">
                    <span className="at-context-menu-title">{colLabel}</span>
                    <span className="at-context-menu-preview">
                        {cellVal ? `"${cellVal}"` : '(empty)'}
                    </span>
                </div>
            )}

            <div className="at-context-menu-body">
                {col && (
                    <button
                        type="button"
                        className="at-context-menu-item"
                        onClick={() => executeCopy(() => copyCellValue(row, col, onToast))}
                    >
                        <Copy size={14} className="at-context-menu-icon" />
                        <span>Copy Cell Value</span>
                    </button>
                )}

                <button
                    type="button"
                    className="at-context-menu-item"
                    onClick={() => executeCopy(() => copyRowTsv(row, effectiveColumns, onToast))}
                >
                    <TableIcon size={14} className="at-context-menu-icon" />
                    <span>Copy Row (Excel / TSV)</span>
                </button>

                <button
                    type="button"
                    className="at-context-menu-item"
                    onClick={() => executeCopy(() => copyRowCsv(row, effectiveColumns, onToast))}
                >
                    <FileSpreadsheet size={14} className="at-context-menu-icon" />
                    <span>Copy Row (CSV)</span>
                </button>

                <button
                    type="button"
                    className="at-context-menu-item"
                    onClick={() => executeCopy(() => copyRowJson(row, onToast))}
                >
                    <FileCode size={14} className="at-context-menu-icon" />
                    <span>Copy Row as JSON</span>
                </button>
            </div>
        </div>
    );
}

export default TableContextMenu;
