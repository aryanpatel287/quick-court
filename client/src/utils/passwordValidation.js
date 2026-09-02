/**
 * Validates a password against comprehensive security rules and edge cases.
 *
 * Checks performed (in order):
 * ─ Basic ─────────────────────────────────────────────────────────
 * 1.  Empty / null input
 * 2.  No spaces allowed (passwords must not contain whitespace)
 * 3.  Length must be 6–128 characters
 * ─ Identity / Context ────────────────────────────────────────────
 * 4.  Password cannot equal the full email address (case-insensitive)
 * 5.  Password cannot equal the email username part (before '@')
 * ─ Common / Weak Password Blocklist ─────────────────────────────
 * 6.  Rejected against an expanded list of the most common passwords
 * ─ Complexity (all passwords, no passphrase bypass) ──────────────
 * 7.  Must contain at least one uppercase letter  [A-Z]
 * 8.  Must contain at least one lowercase letter  [a-z]
 * 9.  Must contain at least one digit             [0-9]
 * 10. Must contain at least one special character (non-alphanumeric)
 * ─ Pattern Checks ────────────────────────────────────────────────
 * 11. No more than 3 consecutive identical characters (e.g. "aaaa")
 * 12. No sequential keyboard / alpha / numeric run of 4+ chars
 *     (e.g. "abcd", "1234", "qwer", "dcba", "4321")
 *
 * @param {string} password - The password to validate.
 * @param {string} email    - Optional. The user's email, used for identity checks.
 * @returns {{isValid: boolean, message: string}}
 */
export const validatePassword = (password, email = '') => {
    // ── 1. Empty / null guard ───────────────────────────────────────
    if (!password) {
        return { isValid: false, message: 'Please enter a password' };
    }

    // ── 2. No spaces allowed ────────────────────────────────────────
    if (/\s/.test(password)) {
        return { isValid: false, message: 'Password cannot contain spaces' };
    }

    // ── 3. Length: 6–128 characters ──────────────────────────────────
    //   Minimum of 6 enforces basic complexity.
    //   Maximum of 128 supports long passphrases & password managers
    //   while preventing DoS via expensive hashing of huge strings.
    if (password.length < 6) {
        return { isValid: false, message: 'Password must be at least 6 characters' };
    }
    if (password.length > 128) {
        return { isValid: false, message: 'Password cannot exceed 128 characters' };
    }

    // ── 4. Must not equal the full email (case-insensitive) ─────────
    if (email && password.toLowerCase() === email.trim().toLowerCase()) {
        return { isValid: false, message: 'Password cannot be the same as your email address' };
    }

    // ── 5. Must not equal the email username part ───────────────────
    if (email) {
        const atIndex = email.indexOf('@');
        const emailUsername = atIndex > -1 ? email.slice(0, atIndex).trim().toLowerCase() : '';
        if (emailUsername && password.toLowerCase() === emailUsername) {
            return {
                isValid: false,
                message: 'Password cannot be the same as your email username',
            };
        }
    }

    // ── 6. Common / weak password blocklist ─────────────────────────
    const commonPasswords = [
        // Top numeric sequences
        '123456',
        '1234567',
        '12345678',
        '123456789',
        '1234567890',
        '12345',
        '123123',
        '111111',
        '000000',
        '654321',
        // Common words
        'password',
        'password1',
        'password123',
        'pass123',
        'passw0rd',
        'admin',
        'admin123',
        'administrator',
        'root',
        'toor',
        'letmein',
        'letmein123',
        'login',
        'welcome',
        'welcome1',
        'secret',
        'monkey',
        'dragon',
        'master',
        'abc123',
        'iloveyou',
        'sunshine',
        'princess',
        'shadow',
        'superman',
        'batman',
        'trustno1',
        'qwerty',
        'qwerty123',
        'qwertyuiop',
        'asdfgh',
        'zxcvbn',
        '1q2w3e',
        '1q2w3e4r',
        // Patterns
        'aaaaaa',
        '111111',
        'aaaa1234',
        'test1234',
        'user1234',
        'changeme',
        'newpass',
        'temp123',
        'guest123',
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
        return {
            isValid: false,
            message: 'Password is too common or weak. Please choose a stronger password.',
        };
    }

    // ── 7. Must contain at least one uppercase letter [A-Z] ─────────
    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must include at least one uppercase letter (A–Z)',
        };
    }

    // ── 8. Must contain at least one lowercase letter [a-z] ─────────
    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must include at least one lowercase letter (a–z)',
        };
    }

    // ── 9. Must contain at least one digit [0-9] ────────────────────
    if (!/\d/.test(password)) {
        return { isValid: false, message: 'Password must include at least one number (0–9)' };
    }

    // ── 10. Must contain at least one special character ─────────────
    if (!/[^A-Za-z0-9]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must include at least one special character (e.g. @, #, !, $)',
        };
    }

    // ── 11. No more than 3 consecutive identical characters ─────────
    //   Catches: "aaaa1A@", "111@Aa1111" etc.
    if (/(.)\1{3,}/.test(password)) {
        return {
            isValid: false,
            message: 'Password cannot contain more than 3 consecutive identical characters',
        };
    }

    // ── 12. No sequential keyboard / alpha / numeric run of 4+ chars ─
    //   Forward and backward sequences are both rejected.
    const SEQUENCES = [
        'abcdefghijklmnopqrstuvwxyz', // alphabet
        '0123456789', // digits
        'qwertyuiop', // keyboard row 1
        'asdfghjkl', // keyboard row 2
        'zxcvbnm', // keyboard row 3
    ];
    const lowerPwd = password.toLowerCase();
    for (const seq of SEQUENCES) {
        for (let i = 0; i <= seq.length - 4; i++) {
            const forward = seq.slice(i, i + 4);
            const backward = forward.split('').reverse().join('');
            if (lowerPwd.includes(forward) || lowerPwd.includes(backward)) {
                return {
                    isValid: false,
                    message:
                        'Password cannot contain sequential characters (e.g. abcd, 1234, qwer, dcba)',
                };
            }
        }
    }

    return { isValid: true, message: '' };
};
