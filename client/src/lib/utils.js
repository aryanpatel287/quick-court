/**
 * Simple, dependency-free classnames merger.
 * Replaces the need for clsx and tailwind-merge in a pure SCSS codebase.
 */
export function cn(...inputs) {
    const classes = [];
    for (const input of inputs) {
        if (!input) continue;

        if (typeof input === 'string' || typeof input === 'number') {
            classes.push(input);
        } else if (Array.isArray(input)) {
            const inner = cn(...input);
            if (inner) classes.push(inner);
        } else if (typeof input === 'object') {
            for (const key in input) {
                if (Object.prototype.hasOwnProperty.call(input, key) && input[key]) {
                    classes.push(key);
                }
            }
        }
    }
    return classes.join(' ');
}
