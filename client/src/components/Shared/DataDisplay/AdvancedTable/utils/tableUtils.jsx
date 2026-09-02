import React from 'react';

/**
 * Utility: parse date string / Date object → comparable Date
 */
export function parseDate(val) {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    // DD-MM-YYYY
    const m1 = String(val).match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (m1) return new Date(+m1[3], +m1[2] - 1, +m1[1]);
    // YYYY-MM-DD
    const m2 = String(val).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3]);
    // natural language like "January 10, 2025"
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Utility: parse numeric / currency string → number
 */
export function parseNumeric(val) {
    if (val === null || val === undefined || val === '' || val === '-') return null;
    const cleaned = String(val).replace(/[₹$€£¥\s,]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
}

/**
 * Helper to highlight query matches in a string or formatted currency/number
 */
function highlightString(str, query) {
    if (!query || (str !== 0 && !str)) return str;
    const stringVal = String(str);
    if (!stringVal) return str;

    const lowerVal = stringVal.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // 1. Direct substring match
    if (lowerVal.includes(lowerQuery)) {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        const parts = stringVal.split(regex);

        return parts.map((part, index) =>
            part.toLowerCase() === lowerQuery ? (
                <mark key={index} className="at-search-highlight">
                    {part}
                </mark>
            ) : (
                part
            ),
        );
    }

    // 2. Cleaned currency/numeric match (e.g. searching '12450' in '₹12,450')
    const cleanQuery = lowerQuery.replace(/[₹$€£¥\s,]/g, '');
    if (cleanQuery && cleanQuery.length > 0) {
        const cleanVal = lowerVal.replace(/[₹$€£¥\s,]/g, '');
        if (cleanVal.includes(cleanQuery)) {
            let cleanIdx = 0;
            let matchStart = -1;
            let matchEnd = -1;

            const targetStart = cleanVal.indexOf(cleanQuery);
            const targetEnd = targetStart + cleanQuery.length;

            for (let i = 0; i < stringVal.length; i++) {
                const char = stringVal[i].toLowerCase();
                if (!/[₹$€£¥\s,]/.test(char)) {
                    if (cleanIdx === targetStart && matchStart === -1) {
                        matchStart = i;
                    }
                    cleanIdx++;
                    if (cleanIdx === targetEnd) {
                        matchEnd = i + 1;
                        break;
                    }
                }
            }

            if (matchStart !== -1 && matchEnd !== -1) {
                const before = stringVal.slice(0, matchStart);
                const match = stringVal.slice(matchStart, matchEnd);
                const after = stringVal.slice(matchEnd);
                return (
                    <>
                        {before}
                        <mark className="at-search-highlight">{match}</mark>
                        {after}
                    </>
                );
            }
        }
    }

    return stringVal;
}

/**
 * Recursively highlight query matches in strings, arrays, or React elements
 */
export function highlightText(node, query) {
    if (
        !query ||
        !query.trim() ||
        node === null ||
        node === undefined ||
        typeof node === 'boolean'
    ) {
        return node;
    }

    const trimmedQuery = query.trim();

    if (typeof node === 'string' || typeof node === 'number') {
        return highlightString(node, trimmedQuery);
    }

    if (Array.isArray(node)) {
        return node.map((child, i) => (
            <React.Fragment key={i}>{highlightText(child, trimmedQuery)}</React.Fragment>
        ));
    }

    if (React.isValidElement(node)) {
        if (
            typeof node.type === 'string' &&
            (node.type === 'svg' ||
                node.type === 'path' ||
                node.type === 'input' ||
                node.type === 'img')
        ) {
            return node;
        }

        if (node.props && node.props.children !== undefined && node.props.children !== null) {
            const newChildren = highlightText(node.props.children, trimmedQuery);
            return React.cloneElement(node, node.props, newChildren);
        }
    }

    return node;
}
