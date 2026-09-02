/**
 * HTML Escaping & Template Helpers
 */

const HTML_ESCAPE_LOOKUP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;',
};

const HTML_ESCAPE_REGEX = /[&<>"'`]/g;

/**
 * Safely escapes HTML special characters to prevent XSS / injection attacks
 *
 * @param {*} value
 * @returns {string} Escaped string
 */
export function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }
    const str = String(value);
    return str.replace(HTML_ESCAPE_REGEX, (match) => HTML_ESCAPE_LOOKUP[match]);
}

/**
 * Format a number as currency
 *
 * @param {number} amount
 * @param {string} [currency='USD']
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
    const num = Number(amount) || 0;
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    } catch {
        return `${currency} ${num.toFixed(2)}`;
    }
}

/**
 * Format a date string or Date object
 *
 * @param {string|Date|number} date
 * @returns {string} Formatted date (e.g. "Oct 24, 2026")
 */
export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return String(date);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d);
}
