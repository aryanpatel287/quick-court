/**
 * Formats a Date object into DD-MM-YYYY string format
 */
export function formatDateToString(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
}

/**
 * Parses string or Date object into a valid Date object
 */
export function parseStringToDate(str) {
    if (!str) return null;
    if (str instanceof Date) return isNaN(str.getTime()) ? null : str;

    if (typeof str === 'string') {
        const indianMatch = str.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (indianMatch) {
            const day = parseInt(indianMatch[1], 10);
            const month = parseInt(indianMatch[2], 10) - 1;
            const year = parseInt(indianMatch[3], 10);
            const d = new Date(year, month, day);
            return isNaN(d.getTime()) ? null : d;
        }

        const isoMatch = str.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (isoMatch) {
            const year = parseInt(isoMatch[1], 10);
            const month = parseInt(isoMatch[2], 10) - 1;
            const day = parseInt(isoMatch[3], 10);
            const d = new Date(year, month, day);
            return isNaN(d.getTime()) ? null : d;
        }
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
}
