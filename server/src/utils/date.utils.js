/**
 * Date utilities enforcing standard DDMMYYYY format across the backend.
 */

/**
 * Formats a Date object or timestamp into DD-MM-YYYY (or custom separator)
 *
 * @param {Date|string|number} date
 * @param {string} [separator='-'] - Separator (e.g. '-' or '/' or '')
 * @returns {string} e.g. "02-09-2026" or "02092026"
 */
export function formatDateToDDMMYYYY(date, separator = '-') {
    if (!date) return '';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}${separator}${month}${separator}${year}`;
}

/**
 * Returns date digits strictly in DDMMYYYY format (no separator)
 *
 * @param {Date|string|number} [date=new Date()]
 * @returns {string} e.g. "02092026"
 */
export function getDDMMYYYY(date = new Date()) {
    return formatDateToDDMMYYYY(date, '');
}

/**
 * Generates a human-readable booking reference using standard DDMMYYYY format
 * Format: BK-DDMMYYYY-XXXXXX
 * Example: BK-02092026-000123
 *
 * @param {number|string} sequence - Incremental counter or random code
 * @param {Date} [date=new Date()] - Booking creation date
 * @returns {string} Formatted booking reference
 */
export function generateBookingReference(sequence, date = new Date()) {
    const datePart = getDDMMYYYY(date);
    const seqPart = String(sequence).padStart(6, '0');
    return `BK-${datePart}-${seqPart}`;
}

/**
 * Parses a DDMMYYYY, DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD string into a valid Date object
 *
 * @param {string} str
 * @returns {Date|null}
 */
export function parseDDMMYYYY(str) {
    if (!str || typeof str !== 'string') return null;
    const clean = str.trim();

    // Match YYYY-MM-DD or YYYY/MM/DD (ISO standard)
    const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10) - 1;
        const day = parseInt(isoMatch[3], 10);
        const d = new Date(year, month, day);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    // Match DD-MM-YYYY or DD/MM/YYYY
    const separatedMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (separatedMatch) {
        const day = parseInt(separatedMatch[1], 10);
        const month = parseInt(separatedMatch[2], 10) - 1;
        const year = parseInt(separatedMatch[3], 10);
        const d = new Date(year, month, day);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    // Match DDMMYYYY (8 digits)
    const rawMatch = clean.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (rawMatch) {
        const day = parseInt(rawMatch[1], 10);
        const month = parseInt(rawMatch[2], 10) - 1;
        const year = parseInt(rawMatch[3], 10);
        const d = new Date(year, month, day);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    return null;
}

