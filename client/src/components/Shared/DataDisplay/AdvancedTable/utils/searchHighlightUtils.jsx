import React from 'react';

/**
 * Check if a raw cell value in a row matches the search term
 *
 * @param {Object} row - Data row object
 * @param {string} colKey - Column key
 * @param {string} searchTerm - Active search query
 * @returns {boolean} True if raw column value matches search query
 */
export function isColumnMatchingSearch(row, colKey, searchTerm) {
    if (!searchTerm || !searchTerm.trim()) return false;
    const rawVal = row[colKey];
    if (rawVal === null || rawVal === undefined) return false;

    const lowerSearch = searchTerm.toLowerCase();
    const cleanSearch = searchTerm.replace(/[₹$€£¥\s,]/g, '').toLowerCase();

    const strVal = String(rawVal).toLowerCase();
    if (strVal.includes(lowerSearch)) return true;

    if (cleanSearch) {
        const cleanVal = strVal.replace(/[₹$€£¥\s,]/g, '');
        if (cleanVal.includes(cleanSearch)) return true;
    }

    return false;
}

/**
 * Recursively inspects a React node tree (primitives, arrays, elements)
 * and highlights search term occurrences.
 *
 * @param {React.ReactNode} node - Target React element or text node
 * @param {string} searchTerm - Search query term to highlight
 * @param {string} highlightClassName - CSS class for highlighted mark element
 * @returns {React.ReactNode} Highlighted React node tree
 */
export function highlightReactTree(node, searchTerm, highlightClassName = 'at-search-highlight') {
    if (
        !searchTerm ||
        !searchTerm.trim() ||
        node === null ||
        node === undefined ||
        typeof node === 'boolean'
    ) {
        return node;
    }

    // 1. Primitive string or number
    if (typeof node === 'string' || typeof node === 'number') {
        const str = String(node);
        const lowerQuery = searchTerm.toLowerCase();
        const lowerStr = str.toLowerCase();
        const cleanQuery = searchTerm.replace(/[₹$€£¥\s,]/g, '').toLowerCase();

        // Direct match
        if (lowerStr.includes(lowerQuery)) {
            const parts = [];
            let lastIdx = 0;
            let currentIdx = lowerStr.indexOf(lowerQuery, lastIdx);

            while (currentIdx !== -1) {
                if (currentIdx > lastIdx) {
                    parts.push(str.slice(lastIdx, currentIdx));
                }
                parts.push(
                    <mark key={`${currentIdx}-${parts.length}`} className={highlightClassName}>
                        {str.slice(currentIdx, currentIdx + searchTerm.length)}
                    </mark>,
                );
                lastIdx = currentIdx + searchTerm.length;
                currentIdx = lowerStr.indexOf(lowerQuery, lastIdx);
            }

            if (lastIdx < str.length) {
                parts.push(str.slice(lastIdx));
            }

            return parts;
        }

        // Normalized currency/numeric match (e.g. search "12450" matching "₹12,450.00")
        if (cleanQuery && cleanQuery.length > 0) {
            const cleanStr = lowerStr.replace(/[₹$€£¥\s,]/g, '');
            if (cleanStr.includes(cleanQuery)) {
                const cleanIdx = cleanStr.indexOf(cleanQuery);
                let rawStart = -1;
                let rawEnd = -1;
                let cCount = 0;

                for (let i = 0; i < str.length; i++) {
                    const ch = lowerStr[i];
                    if (!/[₹$€£¥\s,]/.test(ch)) {
                        if (cCount === cleanIdx && rawStart === -1) {
                            rawStart = i;
                        }
                        if (cCount === cleanIdx + cleanQuery.length - 1) {
                            rawEnd = i + 1;
                            break;
                        }
                        cCount++;
                    }
                }

                if (rawStart !== -1 && rawEnd !== -1) {
                    return (
                        <>
                            {str.slice(0, rawStart)}
                            <mark className={highlightClassName}>
                                {str.slice(rawStart, rawEnd)}
                            </mark>
                            {str.slice(rawEnd)}
                        </>
                    );
                }
            }
        }

        return str;
    }

    // 2. Array of children
    if (Array.isArray(node)) {
        return node.map((child, i) => {
            const highlighted = highlightReactTree(child, searchTerm, highlightClassName);
            return React.isValidElement(highlighted) && !highlighted.key
                ? React.cloneElement(highlighted, { key: i })
                : highlighted;
        });
    }

    // 3. React Element
    if (React.isValidElement(node)) {
        if (!node.props || node.props.children === undefined || node.props.children === null) {
            return node;
        }

        const newChildren = highlightReactTree(node.props.children, searchTerm, highlightClassName);
        if (newChildren === node.props.children) return node;

        return React.cloneElement(node, {
            children: newChildren,
        });
    }

    return node;
}
