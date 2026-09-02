/**
 * Validates an email address and returns an object indicating validity and a descriptive error message.
 *
 * Comprehensive edge-case coverage (RFC 5321 / RFC 5322 aligned):
 * ─ Structural ────────────────────────────────────────────────────
 * - Empty / whitespace-only input
 * - Missing or multiple '@' symbols
 * - Spaces anywhere inside the address
 * - Overall length > 254 characters (RFC 5321 limit)
 * ─ Local-part (before '@') ───────────────────────────────────────
 * - Empty local part  (e.g.  @domain.com)
 * - Local part > 64 characters
 * - Leading or trailing dot  (.user@… / user.@…)
 * - Consecutive dots           (us..er@…)
 * - Invalid characters (only A-Z a-z 0-9 . _ % + - are allowed)
 * ─ Domain (after '@') ────────────────────────────────────────────
 * - Empty domain
 * - Domain starting or ending with a dot  (wewe@.com.in  /  user@domain.)
 * - Domain starting or ending with a hyphen  (user@-domain.com)
 * - Each domain label must be non-empty (catches wewe@.com.in → label "" before "com")
 * - Each domain label > 63 characters
 * - Each label may only contain A-Z a-z 0-9 and hyphens (no underscores etc.)
 * - Label that starts or ends with a hyphen
 * - Missing TLD (no dot in domain)
 * - TLD shorter than 2 characters
 * - TLD longer than 63 characters (RFC 5321)
 * - TLD must be alphabetic only (e.g. rejects .c0m, .123)
 *
 * @param {string} email - The email address to validate.
 * @returns {{isValid: boolean, message: string}}
 */
export const validateEmail = (email) => {
    // ── 1. Empty / null guard ───────────────────────────────────────
    if (!email || !email.trim()) {
        return { isValid: false, message: 'Please enter your email address' };
    }

    const trimmed = email.trim();

    // ── 2. No internal whitespace ───────────────────────────────────
    if (/\s/.test(trimmed)) {
        return { isValid: false, message: 'Email address cannot contain spaces' };
    }

    // ── 3. Overall length (RFC 5321: max 254 chars) ─────────────────
    if (trimmed.length > 254) {
        return { isValid: false, message: 'Email address cannot exceed 254 characters' };
    }

    // ── 4. Must contain exactly one '@' ────────────────────────────
    if (!trimmed.includes('@')) {
        return { isValid: false, message: "Email address must contain an '@' symbol" };
    }

    const atIndex = trimmed.indexOf('@');
    const lastAtIndex = trimmed.lastIndexOf('@');
    if (atIndex !== lastAtIndex) {
        return { isValid: false, message: "Email address can only contain one '@' symbol" };
    }

    const localPart = trimmed.slice(0, atIndex);
    const domainPart = trimmed.slice(atIndex + 1);

    // ══════════════════════════════════════════════════════════════
    //  LOCAL-PART VALIDATION
    // ══════════════════════════════════════════════════════════════

    // ── 5. Non-empty local part ─────────────────────────────────────
    if (!localPart) {
        return {
            isValid: false,
            message: "Email address must have a username before the '@' symbol",
        };
    }

    // ── 6. Local-part length (RFC 5321: max 64 chars) ───────────────
    if (localPart.length > 64) {
        return { isValid: false, message: "The part before '@' cannot exceed 64 characters" };
    }

    // ── 7. Local-part: no leading dot ──────────────────────────────
    if (localPart.startsWith('.')) {
        return { isValid: false, message: 'Email address cannot begin with a dot' };
    }

    // ── 8. Local-part: no trailing dot ─────────────────────────────
    if (localPart.endsWith('.')) {
        return { isValid: false, message: 'The username part cannot end with a dot' };
    }

    // ── 9. Local-part: no consecutive dots ─────────────────────────
    if (localPart.includes('..')) {
        return { isValid: false, message: 'Email address cannot contain consecutive dots' };
    }

    // ── 10. Local-part: allowed characters only ─────────────────────
    //   RFC 5321 / common practice: A-Z a-z 0-9 and . _ % + -
    if (!/^[A-Za-z0-9._%+-]+$/.test(localPart)) {
        return { isValid: false, message: 'Email username contains invalid characters' };
    }

    // ══════════════════════════════════════════════════════════════
    //  DOMAIN VALIDATION
    // ══════════════════════════════════════════════════════════════

    // ── 11. Non-empty domain ────────────────────────────────────────
    if (!domainPart) {
        return {
            isValid: false,
            message: "Email address must contain a domain after the '@' symbol",
        };
    }

    // ── 12. Domain cannot start or end with a dot ───────────────────
    //   This is the core fix for "wewe@.com.in"
    if (domainPart.startsWith('.')) {
        return { isValid: false, message: 'Email domain cannot start with a dot' };
    }
    if (domainPart.endsWith('.')) {
        return { isValid: false, message: 'Email domain cannot end with a dot' };
    }

    // ── 13. Domain cannot start or end with a hyphen ────────────────
    if (domainPart.startsWith('-') || domainPart.endsWith('-')) {
        return { isValid: false, message: 'Email domain cannot start or end with a hyphen' };
    }

    // ── 14. Domain must contain at least one dot (for TLD) ──────────
    if (!domainPart.includes('.')) {
        return {
            isValid: false,
            message: 'Email address is missing a top-level domain (e.g. .com)',
        };
    }

    // ── 15. Validate each domain label individually ─────────────────
    const labels = domainPart.split('.');
    for (const label of labels) {
        // Empty label means double-dot or leading/trailing dot (already caught above, but belt-and-braces)
        if (!label) {
            return {
                isValid: false,
                message: 'Email domain contains consecutive or misplaced dots',
            };
        }
        // Each label max 63 chars (RFC 1035)
        if (label.length > 63) {
            return {
                isValid: false,
                message: 'Each segment of the email domain cannot exceed 63 characters',
            };
        }
        // Labels may only contain letters, digits, and hyphens
        if (!/^[A-Za-z0-9-]+$/.test(label)) {
            return { isValid: false, message: 'Email domain contains invalid characters' };
        }
        // Labels cannot start or end with a hyphen
        if (label.startsWith('-') || label.endsWith('-')) {
            return { isValid: false, message: 'Domain segments cannot start or end with a hyphen' };
        }
    }

    // ── 16. TLD (last label) must be alphabetic, 2–63 chars ─────────
    const tld = labels[labels.length - 1];
    if (tld.length < 2) {
        return {
            isValid: false,
            message: 'Top-level domain must be at least 2 characters (e.g. .com, .in)',
        };
    }
    if (tld.length > 63) {
        return { isValid: false, message: 'Top-level domain cannot exceed 63 characters' };
    }
    if (!/^[A-Za-z]+$/.test(tld)) {
        return {
            isValid: false,
            message: 'Top-level domain must contain only letters (e.g. .com, .org, .in)',
        };
    }

    // ── 17. There must be at least one non-TLD label in the domain ──
    if (labels.length < 2) {
        return {
            isValid: false,
            message: 'Email address is missing a domain name before the top-level domain',
        };
    }

    return { isValid: true, message: '' };
};
