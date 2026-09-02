import jwt from 'jsonwebtoken';
import envConfig from '../../../config/env.config.js';

/**
 * Sign JWT token
 * @param {object} payload
 * @param {string|number} expiresIn
 * @returns {string}
 */
export function signToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, envConfig.JWT_SECRET, { expiresIn });
}

/**
 * Verify JWT token
 * @param {string} token
 * @returns {object} decoded payload
 */
export function verifyToken(token) {
    return jwt.verify(token, envConfig.JWT_SECRET);
}
