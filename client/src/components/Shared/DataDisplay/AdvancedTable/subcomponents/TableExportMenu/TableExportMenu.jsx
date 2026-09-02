import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useClickOutside } from '@/hooks/useClickOutside';
import {
    Download,
    FileText,
    FileSpreadsheet,
    FileType,
    ChevronDown,
    X,
    AlertCircle,
} from 'lucide-react';
import Tooltip from '../../../Tooltip/Tooltip';
import Button from '@/components/Shared/Buttons/Button/Button';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/tableExportUtils';
import './TableExportMenu.scss';

function TableExportMenu({
    data = [],
    columns = [],
    label = 'Export',
    filenamePrefix = 'table-export',
    reportTitle = 'Data Table Report',
    buttonVariant = 'default', // 'default' | 'selection' | 'icon'
    disabled = false,
    onExport,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingExportFormat, setPendingExportFormat] = useState(null);
    const menuRef = useRef(null);

    useClickOutside(menuRef, () => setIsOpen(false), { enabled: isOpen });

    // Step 1: User selects format from dropdown → Open confirmation modal
    const handleSelectFormat = (e, format) => {
        if (e) {
            e.stopPropagation();
        }
        setIsOpen(false);
        setTimeout(() => {
            setPendingExportFormat(format);
        }, 50);
    };

    // Step 2: User confirms download inside modal
    const confirmDownload = () => {
        if (!pendingExportFormat) return;

        const format = pendingExportFormat;
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `${filenamePrefix}-${timestamp}`;

        if (format === 'csv') {
            exportToCSV(data, columns, `${filename}.csv`);
        } else if (format === 'excel') {
            exportToExcel(data, columns, `${filename}.xls`);
        } else if (format === 'pdf') {
            exportToPDF(data, columns, filename, reportTitle);
        }

        if (onExport) {
            onExport(format, data);
        }

        setPendingExportFormat(null);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            setPendingExportFormat(null);
        }
    };

    const isSelectionVariant = buttonVariant === 'selection';
    const isIconVariant = buttonVariant === 'icon';
    const rowCount = data.length;
    const columnCount = columns.length;

    const formatMeta = {
        csv: { name: 'CSV Document', ext: '.csv', icon: FileType, colorClass: 'csv' },
        excel: {
            name: 'Excel Spreadsheet',
            ext: '.xls',
            icon: FileSpreadsheet,
            colorClass: 'excel',
        },
        pdf: { name: 'PDF Report', ext: '.pdf', icon: FileText, colorClass: 'pdf' },
    };

    const selectedFormat = pendingExportFormat ? formatMeta[pendingExportFormat] : null;
    const FormatIcon = selectedFormat ? selectedFormat.icon : FileText;

    // Modal JSX (Portal to body to prevent z-index/overflow clipping)
    const renderConfirmationModal = () => {
        if (!pendingExportFormat || !selectedFormat) return null;

        return createPortal(
            <div className="at-export-modal-backdrop" onClick={handleBackdropClick}>
                <div
                    className="at-export-modal-dialog"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="export-modal-title"
                >
                    {/* Header */}
                    <div className="at-export-modal-header">
                        <div className="at-export-modal-title-wrap">
                            <div
                                className={`at-export-modal-icon-badge ${selectedFormat.colorClass}`}
                            >
                                <Download size={18} />
                            </div>
                            <div>
                                <h3 id="export-modal-title" className="at-export-modal-title">
                                    Confirm Export Download
                                </h3>
                                <p className="at-export-modal-subtitle">
                                    {isSelectionVariant
                                        ? 'Exporting selected rows'
                                        : 'Exporting table dataset'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="at-export-modal-close-btn"
                            onClick={() => setPendingExportFormat(null)}
                            aria-label="Close confirmation dialog"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="at-export-modal-body">
                        <div className="at-export-modal-notice">
                            <AlertCircle size={18} className="notice-icon" />
                            <div className="notice-text">
                                {isSelectionVariant ? (
                                    <span>
                                        You are about to download{' '}
                                        <strong>
                                            {rowCount.toLocaleString()} selected row
                                            {rowCount > 1 ? 's' : ''}
                                        </strong>
                                        .
                                    </span>
                                ) : (
                                    <span>
                                        You are about to download the <strong>entire table</strong>{' '}
                                        containing{' '}
                                        <strong>
                                            {rowCount.toLocaleString()} row{rowCount > 1 ? 's' : ''}
                                        </strong>
                                        .
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Spec Card */}
                        <div className="at-export-spec-card">
                            <div className="spec-row">
                                <span className="spec-label">Download Scope:</span>
                                <span className="spec-value highlight">
                                    {isSelectionVariant
                                        ? `${rowCount.toLocaleString()} Selected Rows`
                                        : `Entire Table (${rowCount.toLocaleString()} Rows)`}
                                </span>
                            </div>

                            <div className="spec-row">
                                <span className="spec-label">Columns Included:</span>
                                <span className="spec-value">{columnCount} Columns</span>
                            </div>

                            <div className="spec-row">
                                <span className="spec-label">File Format:</span>
                                <span className="spec-value format-pill">
                                    <FormatIcon size={14} />
                                    {selectedFormat.name} ({selectedFormat.ext})
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="at-export-modal-footer">
                        <Button preset="cancel" onClick={() => setPendingExportFormat(null)} />

                        <Button variant="primary" size="md" onClick={confirmDownload}>
                            <Download size={15} />
                            <span>
                                {isSelectionVariant
                                    ? `Download ${rowCount} Row${rowCount > 1 ? 's' : ''}`
                                    : `Download Entire Table (${rowCount.toLocaleString()} Rows)`}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>,
            document.body,
        );
    };

    return (
        <div className="at-export-menu-wrapper" ref={menuRef}>
            {isIconVariant ? (
                <Tooltip content={isOpen ? null : 'Export table data'} position="top" usePortal>
                    <button
                        type="button"
                        className={`at-export-btn icon-only ${isOpen ? 'is-open' : ''}`}
                        onClick={() => setIsOpen((prev) => !prev)}
                        disabled={disabled || data.length === 0}
                        aria-label="Export options"
                    >
                        <Download size={14} />
                    </button>
                </Tooltip>
            ) : isSelectionVariant ? (
                <Tooltip content={isOpen ? null : 'Export Selected Rows'} position="top" usePortal>
                    <button
                        type="button"
                        className={`selection-action-btn ${isOpen ? 'is-active' : ''}`}
                        onClick={() => setIsOpen((prev) => !prev)}
                        disabled={disabled || data.length === 0}
                        aria-label="Export selected rows"
                    >
                        <Download size={16} />
                    </button>
                </Tooltip>
            ) : (
                <Tooltip content={isOpen ? null : 'Export table data'} position="top" usePortal>
                    <button
                        type="button"
                        className={`at-export-btn ${isOpen ? 'is-open' : ''}`}
                        onClick={() => setIsOpen((prev) => !prev)}
                        disabled={disabled || data.length === 0}
                        aria-label="Export table options"
                    >
                        <Download size={14} />
                        <span>{label}</span>
                        <ChevronDown size={12} className="chevron-icon" />
                    </button>
                </Tooltip>
            )}

            {isOpen && (
                <div
                    className={`at-export-dropdown-menu ${isSelectionVariant ? 'selection-menu' : ''}`}
                >
                    <div className="export-menu-header">Export Format</div>
                    <button
                        type="button"
                        className="export-menu-item"
                        onClick={(e) => handleSelectFormat(e, 'csv')}
                    >
                        <div className="export-icon-box csv">
                            <FileType size={16} />
                        </div>
                        <div className="item-text-group">
                            <span className="item-title">CSV Document</span>
                            <span className="item-sub">Comma-separated values (.csv)</span>
                        </div>
                    </button>

                    <button
                        type="button"
                        className="export-menu-item"
                        onClick={(e) => handleSelectFormat(e, 'excel')}
                    >
                        <div className="export-icon-box excel">
                            <FileSpreadsheet size={16} />
                        </div>
                        <div className="item-text-group">
                            <span className="item-title">Excel Spreadsheet</span>
                            <span className="item-sub">Microsoft Excel format (.xls)</span>
                        </div>
                    </button>

                    <button
                        type="button"
                        className="export-menu-item"
                        onClick={(e) => handleSelectFormat(e, 'pdf')}
                    >
                        <div className="export-icon-box pdf">
                            <FileText size={16} />
                        </div>
                        <div className="item-text-group">
                            <span className="item-title">PDF Document</span>
                            <span className="item-sub">Printable PDF report (.pdf)</span>
                        </div>
                    </button>
                </div>
            )}

            {renderConfirmationModal()}
        </div>
    );
}

export default TableExportMenu;
