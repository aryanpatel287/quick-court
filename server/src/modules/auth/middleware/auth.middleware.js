import redis from '../../../config/cache.config.js';
import { verifyToken } from '../utils/jwt.js';
import { getUserById } from '../../../dao/user.dao.js';
import { sendResponse } from '../../../utils/response.utlis.js';
import envConfig from '../../../config/env.config.js';

/**
 * Route protection middleware to authenticate requests via JWT cookie or header
 */
export async function protect(req, res, next) {
    try {
        let token;

        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return sendResponse({
                res,
                statusCode: 401,
                message: 'You are not logged in. Please log in to gain access.',
                success: false,
            });
        }

        try {
            const isBlacklisted = await redis.get(`blacklist:${token}`);
            if (isBlacklisted) {
                return sendResponse({
                    res,
                    statusCode: 401,
                    message: 'Your session has expired or been logged out. Please log in again.',
                    success: false,
                });
            }
        } catch (redisError) {
            console.error('Redis blacklist check error:', redisError);
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (jwtError) {
            return sendResponse({
                res,
                statusCode: 401,
                message: 'Invalid token. Please log in again.',
                success: false,
                error: jwtError.message,
            });
        }

        const user = await getUserById(decoded.id);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 401,
                message: 'The user belonging to this token no longer exists.',
                success: false,
            });
        }

        if (!user.isActive) {
            return sendResponse({
                res,
                statusCode: 401,
                message: 'Your account has been deactivated. Please contact support.',
                success: false,
            });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('Auth protect middleware error:', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'An internal authentication error occurred.',
            success: false,
        });
    }
}

/**
 * Role restriction middleware for RBAC checks
 */
export function restrictTo(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return sendResponse({
                res,
                statusCode: 403,
                message: 'You do not have permission to perform this action.',
                success: false,
            });
        }
        next();
    };
}

/**
 * Basic Redis fixed-window counter IP rate limiter
 */
export function rateLimiter({ windowMs = 15 * 60 * 1000, maxRequests = 1000 } = {}) {
    if (!envConfig.IS_PRODUCTION) return (req, res, next) => next();

    return async (req, res, next) => {
        const key = `ratelimit:${req.ip}:${req.originalUrl || req.url}`;
        try {
            const currentRequests = await redis.incr(key);
            if (currentRequests === 1) {
                await redis.pexpire(key, windowMs);
            }

            if (currentRequests > maxRequests) {
                return sendResponse({
                    res,
                    statusCode: 429,
                    message: 'Too many requests from this IP. Please try again later.',
                    success: false,
                });
            }
        } catch (error) {
            console.error('Rate limiter Redis error:', error);
        }
        next();
    };
}
