import crypto from 'crypto';

/**
 * Generates a temporary cryptographically secure password of a given length (default 8)
 * that satisfies all security validations and pattern checks.
 *
 * @param {number} [length=8] - Target length of the temporary password (must be at least 6).
 * @returns {string} The generated temporary password.
 */

export function generateTempPassword(length = 8) {
    if (length < 6) {
        throw new Error('Password length must be at least 6 characters');
    }

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*()-_=+';

    const allChars = uppercase + lowercase + digits + special;

    const password = [
        uppercase[crypto.randomInt(uppercase.length)],
        lowercase[crypto.randomInt(lowercase.length)],
        digits[crypto.randomInt(digits.length)],
        special[crypto.randomInt(special.length)],
    ];

    while (password.length < length) {
        password.push(allChars[crypto.randomInt(allChars.length)]);
    }

    for (let i = password.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);

        [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
}
