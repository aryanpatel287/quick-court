import bcrypt from 'bcryptjs';
import redis from '../../../config/cache.config.js';
import { createUser, getUserByEmail } from '../../../dao/user.dao.js';
import { AppError } from '../utils/appError.js';
import jwt from 'jsonwebtoken';

/**
 * Register a new user
 * @param {object} param0 name, email, password
 * @returns {object} created user
 */
export async function register({ name, email, password }) {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        throw new AppError('Email is already registered', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await createUser({
        name,
        email,
        password: hashedPassword,
        role: 'USER',
        emailVerified: false,
        isActive: true,
        isDeleted: false,
    });

    return user;
}

/**
 * Login user
 * @param {object} param0 email, password
 * @returns {object} authenticated user
 */
export async function login({ email, password }) {
    const user = await getUserByEmail(email);
    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
        throw new AppError('Your account has been deactivated. Please contact support.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new AppError('Invalid email or password', 401);
    }

    return user;
}

/**
 * Logout user by blacklisting their token in Redis
 * @param {string} token
 */
export async function logout(token) {
    try {
        let ttl = 86400; // default 24h

        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                const now = Math.floor(Date.now() / 1000);
                const remaining = decoded.exp - now;
                if (remaining > 0) {
                    ttl = remaining;
                }
            }
        } catch (jwtErr) {
            console.error('Failed to decode JWT expiration for logout TTL:', jwtErr);
        }

        await redis.set(`blacklist:${token}`, '1', 'EX', ttl);
    } catch (error) {
        console.error('Logout blacklist error in Redis:', error);
        throw new AppError('Logout failed due to an internal server error', 500);
    }
}
