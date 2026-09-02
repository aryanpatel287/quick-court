/**
 * @file tableCopyUtils.js
 * @description Modular helper utility for copy operations across cells, rows, and selected data.
 */

/**
 * Low-level utility to copy text to system clipboard with fallback support
 * for older browser environments.
 *
 * @param {string}   text    - The raw string text to copy.
 * @param {string}   [label] - Optional user-friendly toast message label.
 * @param {function} [onToast] - Optional callback triggered on successful copy.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function copyToClipboard(text, label, onToast) {
    if (text === undefined || text === null) return false;

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(String(text));
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = String(text);
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            textarea.style.pointerEvents = 'none';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }

        if (onToast && label) {
            onToast(label);
        }
        return true;
    } catch (err) {
        console.error('Failed to copy text to clipboard:', err);
        return false;
    }
}

/**
 * Copies a single cell's value to the clipboard.
 *
 * @param {object}   row     - The table row object.
 * @param {object}   col     - The column configuration object ({ key, label }).
 * @param {function} [onToast] - Toast notification callback.
 */
export function copyCellValue(row, col, onToast) {
    if (!row || !col) return;
    const rawValue = row[col.key];
    const valString = rawValue !== undefined && rawValue !== null ? String(rawValue) : '';
    const colName = col.label || col.key || 'Cell';
    const displayVal = valString.length > 30 ? valString.slice(0, 30) + '...' : valString;
    copyToClipboard(valString, `Copied ${colName}: "${displayVal}"`, onToast);
}

/**
 * Formats and copies an entire row as Tab-Separated Values (TSV for Excel / Sheets).
 *
 * @param {object}   row              - The table row object.
 * @param {Array}    effectiveColumns - Array of column definition objects.
 * @param {function} [onToast]          - Toast notification callback.
 */
export function copyRowTsv(row, effectiveColumns = [], onToast) {
    if (!row) return;
    const colsToUse =
        effectiveColumns.length > 0 ? effectiveColumns : Object.keys(row).map((k) => ({ key: k }));
    const rowValues = colsToUse.map((c) => {
        const v = row[c.key];
        return v !== undefined && v !== null ? String(v) : '';
    });
    const tsvString = rowValues.join('\t');
    copyToClipboard(tsvString, 'Copied entire row (Excel / TSV)', onToast);
}

/**
 * Formats and copies an entire row as Comma-Separated Values (CSV).
 *
 * @param {object}   row              - The table row object.
 * @param {Array}    effectiveColumns - Array of column definition objects.
 * @param {function} [onToast]          - Toast notification callback.
 */
export function copyRowCsv(row, effectiveColumns = [], onToast) {
    if (!row) return;
    const colsToUse =
        effectiveColumns.length > 0 ? effectiveColumns : Object.keys(row).map((k) => ({ key: k }));
    const rowValues = colsToUse.map((c) => {
        const val = String(row[c.key] ?? '');
        return val.includes(',') || val.includes('"') || val.includes('\n')
            ? `"${val.replace(/"/g, '""')}"`
            : val;
    });
    const csvString = rowValues.join(',');
    copyToClipboard(csvString, 'Copied row as CSV', onToast);
}

/**
 * Copies a single row object as a formatted JSON string.
 *
 * @param {object}   row     - The table row object.
 * @param {function} [onToast] - Toast notification callback.
 */
export function copyRowJson(row, onToast) {
    if (!row) return;
    const jsonString = JSON.stringify(row, null, 2);
    copyToClipboard(jsonString, 'Copied row as JSON', onToast);
}

/**
 * Copies multiple selected rows formatted as TSV, CSV, or JSON.
 *
 * @param {Array}    selectedRows     - Array of selected row objects.
 * @param {Array}    effectiveColumns - Array of column definition objects.
 * @param {string}   [format='tsv']   - 'tsv', 'csv', or 'json'.
 * @param {function} [onToast]          - Toast notification callback.
 */
export function copySelectedRows(
    selectedRows = [],
    effectiveColumns = [],
    format = 'tsv',
    onToast,
) {
    if (!selectedRows || selectedRows.length === 0) return;

    if (format === 'json') {
        const jsonString = JSON.stringify(selectedRows, null, 2);
        copyToClipboard(jsonString, `Copied ${selectedRows.length} rows as JSON`, onToast);
        return;
    }

    const colsToUse =
        effectiveColumns.length > 0
            ? effectiveColumns
            : Object.keys(selectedRows[0]).map((k) => ({ key: k }));
    const delimiter = format === 'csv' ? ',' : '\t';

    const headerRow = colsToUse.map((c) => c.label || c.key).join(delimiter);
    const dataRows = selectedRows.map((row) => {
        return colsToUse
            .map((c) => {
                const val = String(row[c.key] ?? '');
                if (
                    format === 'csv' &&
                    (val.includes(',') || val.includes('"') || val.includes('\n'))
                ) {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            })
            .join(delimiter);
    });

    const fullText = [headerRow, ...dataRows].join('\n');
    const labelText =
        format === 'csv'
            ? `Copied ${selectedRows.length} rows as CSV`
            : `Copied ${selectedRows.length} rows (Excel / TSV)`;

    copyToClipboard(fullText, labelText, onToast);
}
