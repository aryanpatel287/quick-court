import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import redis from '../../../config/cache.config.js';
import envConfig from '../../../config/env.config.js';

import {
    getUserByEmail,
    getUserById,
    createUser,
    updateUser,
    getDeletedUserByEmail,
    recoverUser,
} from '../../../dao/user.dao.js';

import { sendResponse, sendTokenResponse, setTokenCookie } from '../../../utils/response.utlis.js';
import { sendEmail } from '../../../services/mail/mail.service.js';
import {
    issueOtp,
    verifyOtp as verifyOtpUtil,
    resendOtp,
    OTP_PURPOSES,
    getOtpHtml,
    getForgotPasswordOtpHtml,
    getRecoverAccountOtpHtml,
    getAccountRecoveredHtml,
    normalizeEmail,
} from '../../../utils/otp.utils.js';

/**
 * Handle user registration request
 */
export async function registerUser(req, res, next) {
    try {
        const { email, password, firstName, lastName, profileImage } = req.body || {};
        const normalizedEmail = normalizeEmail(email);
        const passwordValue = typeof password === 'string' ? password : '';
        const firstNameValue = typeof firstName === 'string' ? firstName.trim() : '';
        const lastNameValue = typeof lastName === 'string' ? lastName.trim() : '';

        if (!normalizedEmail || !passwordValue || !firstNameValue || !lastNameValue) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'First Name, Last Name, email, and password are required.',
                success: false,
            });
        }

        const existingUser = await getUserByEmail(normalizedEmail);
        if (existingUser) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email is already registered',
                success: false,
            });
        }

        const hashedPassword = await bcrypt.hash(passwordValue, 10);

        const user = await createUser({
            email: normalizedEmail,
            password: hashedPassword,
            firstName: firstNameValue,
            lastName: lastNameValue,
            profileImage: profileImage || null,
            role: 'USER',
            emailVerified: false,
            isActive: true,
            isDeleted: false,
        });

        await issueOtp({
            email: normalizedEmail,
            purpose: OTP_PURPOSES.VERIFY_EMAIL,
            subject: 'QuickCourt Email Verification',
            buildHtml: getOtpHtml,
        });

        return sendResponse({
            res,
            statusCode: 201,
            message: 'User registered successfully. Please verify the OTP sent to your email.',
            success: true,
            data: {
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    emailVerified: user.emailVerified,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Handle facility owner registration request (DEV 1 Facility Owner Endpoint)
 */
export async function registerFacilityOwner(req, res, next) {
    try {
        const { email, password, firstName, lastName, profileImage } = req.body || {};
        const normalizedEmail = normalizeEmail(email);
        const passwordValue = typeof password === 'string' ? password : '';
        const firstNameValue = typeof firstName === 'string' ? firstName.trim() : '';
        const lastNameValue = typeof lastName === 'string' ? lastName.trim() : '';

        if (!normalizedEmail || !passwordValue || !firstNameValue || !lastNameValue) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'First Name, Last Name, email, and password are required.',
                success: false,
            });
        }

        const existingUser = await getUserByEmail(normalizedEmail);
        if (existingUser) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email is already registered',
                success: false,
            });
        }

        const hashedPassword = await bcrypt.hash(passwordValue, 10);

        const user = await createUser({
            email: normalizedEmail,
            password: hashedPassword,
            firstName: firstNameValue,
            lastName: lastNameValue,
            profileImage: profileImage || null,
            role: 'FACILITY_OWNER',
            emailVerified: false,
            isActive: true,
            isDeleted: false,
        });

        await issueOtp({
            email: normalizedEmail,
            purpose: OTP_PURPOSES.VERIFY_EMAIL,
            subject: 'QuickCourt Facility Owner Email Verification',
            buildHtml: getOtpHtml,
        });

        return sendResponse({
            res,
            statusCode: 201,
            message:
                'Facility owner registered successfully. Please verify the OTP sent to your email.',
            success: true,
            data: {
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    emailVerified: user.emailVerified,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Handle user registration request
 */
export async function register(req, res, next) {
    try {
        const { email, password, firstName, lastName, profileImage, role } = req.body || {};
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const passwordValue = typeof password === 'string' ? password : '';
        const firstNameValue = typeof firstName === 'string' ? firstName.trim() : '';
        const lastNameValue = typeof lastName === 'string' ? lastName.trim() : '';

        if (!normalizedEmail || !passwordValue || !firstNameValue || !lastNameValue) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Name, email, and password are required.',
                success: false,
            });
        }

        const existingUser = await getUserByEmail(normalizedEmail);
        if (existingUser) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email is already registered',
                success: false,
            });
        }

        const isVerifiedKey = `verified_email:${normalizedEmail}`;
        const isEmailVerified = await redis.get(isVerifiedKey);

        let emailVerified = false;
        if (isEmailVerified) {
            emailVerified = true;
            await redis.del(isVerifiedKey);
        } else {
            const otpResult = await issueOtp({
                email: normalizedEmail,
                purpose: OTP_PURPOSES.VERIFY_EMAIL,
                subject: 'Verification Email',
                buildHtml: getOtpHtml,
            });

            if (!otpResult.ok) {
                return sendResponse({
                    res,
                    statusCode: 400,
                    message: 'Unable to generate OTP.',
                    success: false,
                });
            }
        }

        const hashedPassword = await bcrypt.hash(passwordValue, 10);

        let mappedRole = 'USER';
        if (role === 'admin' || role === 'ADMIN') {
            mappedRole = 'ADMIN';
        } else if (role === 'facility_owner' || role === 'FACILITY_OWNER') {
            mappedRole = 'FACILITY_OWNER';
        }

        const user = await createUser({
            email: normalizedEmail,
            password: hashedPassword,
            firstName: firstNameValue,
            lastName: lastNameValue,
            profileImage: profileImage,
            role: mappedRole,
            emailVerified: emailVerified,
            isActive: true,
            isDeleted: false,
        });

        return sendTokenResponse(res, 201, 'User registered successfully', user);
    } catch (error) {
        next(error);
    }
}

/**
 * Send pre-registration verification OTP
 */
export async function sendVerificationOtp(req, res, next) {
    try {
        const email = normalizeEmail(req.body?.email);
        if (!email) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email is required.',
                success: false,
            });
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email is already registered.',
                success: false,
            });
        }

        const otpResult = await issueOtp({
            email,
            purpose: OTP_PURPOSES.VERIFY_EMAIL,
            subject: 'Verification Email',
            buildHtml: getOtpHtml,
        });

        if (!otpResult.ok) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Unable to generate OTP.',
                success: false,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Verification OTP sent successfully.',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Handle user login request
 */
export async function login(req, res, next) {
    try {
        const { email, password, rememberMe, remember } = req.body || {};

        if (!email || !password) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email and password are required.',
                success: false,
            });
        }

        const user = await getUserByEmail(email.trim().toLowerCase(), true);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 401,
                message: 'Incorrect email or password.',
                success: false,
            });
        }

        if (user.isDeleted) {
            const now = new Date();
            const recoveryExpiresAt = user.recoveryExpiresAt
                ? new Date(user.recoveryExpiresAt)
                : null;

            if (!recoveryExpiresAt || now <= recoveryExpiresAt) {
                const daysRemaining = recoveryExpiresAt
                    ? Math.max(
                          0,
                          Math.ceil(
                              (recoveryExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                          ),
                      )
                    : 15;

                return sendResponse({
                    res,
                    statusCode: 403,
                    message: 'This account has been deleted. Please recover it to login.',
                    success: false,
                    isDeleted: true,
                    canRecover: true,
                    recoveryExpiresAt: user.recoveryExpiresAt,
                    daysRemaining,
                });
            } else {
                return sendResponse({
                    res,
                    statusCode: 410,
                    message: 'Recovery period has expired.',
                    success: false,
                    canRecover: false,
                });
            }
        }

        if (!user.isActive) {
            return sendResponse({
                res,
                statusCode: 403,
                message: 'Your account has been deactivated or banned. Please contact support.',
                success: false,
            });
        }

        if (!user.emailVerified) {
            return sendResponse({
                res,
                statusCode: 403,
                message: 'Please verify your email address before logging in.',
                success: false,
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return sendResponse({
                res,
                statusCode: 401,
                message: 'Incorrect email or password.',
                success: false,
            });
        }

        return sendTokenResponse(res, 200, 'Login successful.', user, !!(rememberMe || remember));
    } catch (error) {
        next(error);
    }
}

/**
 * Handle user logout request
 */
export async function logout(req, res, next) {
    try {
        const token = req.token || req.cookies.token;
        if (!token) {
            return sendResponse({
                res,
                statusCode: 401,
                message: 'Unauthorized. No token provided.',
                success: false,
            });
        }

        // Blacklist token in Redis for 24 hours (86400 seconds)
        await redis.set(`blacklist:${token}`, 'true', 'EX', 24 * 60 * 60);

        res.clearCookie('token');

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Logout successful.',
            success: true,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Verify user's email address using OTP
 */
export async function verifyEmail(req, res, next) {
    try {
        const email = normalizeEmail(req.body?.email);
        const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

        if (!email || !otp) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'Email and OTP are required',
            });
        }

        const verifyResult = await verifyOtpUtil({
            email,
            otp,
            purpose: OTP_PURPOSES.VERIFY_EMAIL,
        });

        if (!verifyResult.ok) {
            if (verifyResult.reason === 'locked') {
                return sendResponse({
                    res,
                    statusCode: 429,
                    success: false,
                    message: 'Too many attempts. Please register again.',
                });
            }

            if (verifyResult.reason === 'expired') {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'OTP expired',
                });
            }

            if (verifyResult.reason === 'invalid') {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'Invalid OTP',
                    attemptsLeft: verifyResult.attemptsLeft,
                    cooldownRemaining: verifyResult.cooldownRemaining,
                });
            }

            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'OTP expired or invalid',
            });
        }

        const user = await getUserByEmail(email);
        if (user) {
            const updatedUser = await updateUser(user.id, { emailVerified: true, isActive: true });
            return sendTokenResponse(res, 200, 'Email verified successfully', updatedUser || user);
        } else {
            await redis.set(`verified_email:${email}`, 'true', 'EX', 3600);
            return sendResponse({
                res,
                statusCode: 200,
                success: true,
                message: 'Email verified successfully',
            });
        }
    } catch (error) {
        next(error);
    }
}

export const verifyOtp = verifyEmail;

/**
 * Resend OTP code
 */
export async function resendOtpHandler(req, res, next) {
    try {
        const { email, purpose } = req.body || {};
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const normalizedPurpose = typeof purpose === 'string' ? purpose.trim() : '';
        const resolvedPurpose = normalizedPurpose || OTP_PURPOSES.VERIFY_EMAIL;

        if (!normalizedEmail) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'Email is required',
            });
        }

        if (
            resolvedPurpose !== OTP_PURPOSES.VERIFY_EMAIL &&
            resolvedPurpose !== OTP_PURPOSES.FORGOT_PASSWORD &&
            resolvedPurpose !== OTP_PURPOSES.RECOVER_ACCOUNT
        ) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'Invalid OTP purpose',
            });
        }

        let otpConfig;
        if (resolvedPurpose === OTP_PURPOSES.FORGOT_PASSWORD) {
            otpConfig = {
                subject: 'Reset your password',
                buildHtml: getForgotPasswordOtpHtml,
                missingMessage: 'Password reset session expired. Please request a new OTP.',
            };
        } else if (resolvedPurpose === OTP_PURPOSES.RECOVER_ACCOUNT) {
            otpConfig = {
                subject: 'Recover your account',
                buildHtml: getRecoverAccountOtpHtml,
                missingMessage: 'Account recovery session expired. Please request a new OTP.',
            };
        } else {
            otpConfig = {
                subject: 'Resend Verification OTP',
                buildHtml: getOtpHtml,
                missingMessage: 'Verification session expired. Please register again.',
            };
        }

        const resendResult = await resendOtp({
            email: normalizedEmail,
            purpose: resolvedPurpose,
            subject: otpConfig.subject,
            buildHtml: otpConfig.buildHtml,
        });

        if (!resendResult.ok) {
            if (resendResult.reason === 'cooldown') {
                return sendResponse({
                    res,
                    statusCode: 429,
                    success: false,
                    message: `Please wait ${resendResult.cooldownRemaining}s before requesting another OTP`,
                    cooldownRemaining: resendResult.cooldownRemaining,
                });
            }

            if (resendResult.reason === 'resend-limit') {
                return sendResponse({
                    res,
                    statusCode: 429,
                    success: false,
                    message: 'Maximum resend limit reached',
                    resendLimitReached: true,
                });
            }

            if (resendResult.reason === 'expired') {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: otpConfig.missingMessage,
                });
            }

            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: otpConfig.missingMessage,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'OTP resent successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Handle password reset OTP request
 */
export async function forgotPassword(req, res, next) {
    try {
        const email = normalizeEmail(req.body?.email);

        if (!email) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email is required.',
                success: false,
            });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'No account found for this email address.',
            });
        }

        const otpResult = await issueOtp({
            email,
            purpose: OTP_PURPOSES.FORGOT_PASSWORD,
            subject: 'Reset your password',
            buildHtml: getForgotPasswordOtpHtml,
        });

        if (!otpResult.ok) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Unable to generate password reset OTP.',
                success: false,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'OTP sent to the registered email. Please check your inbox.',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Verify password reset OTP
 */
export async function verifyForgotPasswordOtp(req, res, next) {
    try {
        const email = normalizeEmail(req.body?.email);
        const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

        if (!email || !otp) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'Email and OTP are required.',
            });
        }

        const verifyResult = await verifyOtp({
            email,
            otp,
            purpose: OTP_PURPOSES.FORGOT_PASSWORD,
        });

        if (!verifyResult.ok) {
            if (verifyResult.reason === 'locked') {
                return sendResponse({
                    res,
                    statusCode: 429,
                    success: false,
                    message: 'Too many attempts. Please request a new OTP.',
                });
            }

            if (verifyResult.reason === 'expired') {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'OTP expired',
                });
            }

            if (verifyResult.reason === 'invalid') {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'Invalid OTP',
                    attemptsLeft: verifyResult.attemptsLeft,
                    cooldownRemaining: verifyResult.cooldownRemaining,
                });
            }

            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'OTP expired or invalid',
            });
        }

        // OTP is valid. Store verification flag in Redis for 10 minutes (600 seconds)
        await redis.set(`verified_reset:${email}`, 'true', 'EX', 600);

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'OTP verified successfully.',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Handle password reset completion using OTP
 */
export async function resetPassword(req, res, next) {
    try {
        const email = normalizeEmail(req.body?.email);
        const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
        const password = typeof req.body?.password === 'string' ? req.body.password : '';
        const confirmPassword =
            typeof req.body?.confirmPassword === 'string' ? req.body.confirmPassword : '';

        if (!email || !otp || !password || !confirmPassword) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email, OTP, password, and confirm password are required.',
                success: false,
            });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'No valid account exists for this email.',
            });
        }

        if (password !== confirmPassword) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Passwords do not match.',
                success: false,
            });
        }

        //New password cannot be same as previous password.
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'New password cannot be same as previous password.',
                success: false,
            });
        }

        const isAlreadyVerified = await redis.get(`verified_reset:${email}`);
        if (isAlreadyVerified) {
            await redis.del(`verified_reset:${email}`);
        } else {
            const verifyResult = await verifyOtp({
                email,
                otp,
                purpose: OTP_PURPOSES.FORGOT_PASSWORD,
            });

            if (!verifyResult.ok) {
                if (verifyResult.reason === 'locked') {
                    return sendResponse({
                        res,
                        statusCode: 429,
                        success: false,
                        message: 'Too many attempts. Please request a new OTP.',
                    });
                }

                if (verifyResult.reason === 'expired') {
                    return sendResponse({
                        res,
                        statusCode: 400,
                        success: false,
                        message: 'OTP expired',
                    });
                }

                if (verifyResult.reason === 'invalid') {
                    return sendResponse({
                        res,
                        statusCode: 400,
                        success: false,
                        message: 'Invalid OTP',
                        attemptsLeft: verifyResult.attemptsLeft,
                        cooldownRemaining: verifyResult.cooldownRemaining,
                    });
                }

                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'OTP expired or invalid',
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await updateUser(user.id, { password: hashedPassword });

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Password reset successful.',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get current logged in user details
 */
export async function getMe(req, res, next) {
    try {
        const userId = req.user.id;
        const cacheKey = `user:${userId}`;
        let user;
        let fromCache = false;

        try {
            const cachedUser = await redis.get(cacheKey);
            if (cachedUser) {
                user = JSON.parse(cachedUser);
                fromCache = true;
            }
        } catch (cacheError) {
            console.error('Redis cache get error in getMe:', cacheError);
        }

        if (!user) {
            user = await getUserById(userId);
            if (!user) {
                return sendResponse({
                    res,
                    statusCode: 404,
                    message: 'User not found.',
                    success: false,
                });
            }
            try {
                await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600); // cache for 1 hour
            } catch (cacheError) {
                console.error('Redis cache set error in getMe:', cacheError);
            }
        }

        const userData = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        return sendResponse({
            res,
            statusCode: fromCache ? 203 : 200,
            message: 'User retrieved successfully',
            success: true,
            data: { user: userData },
            user: userData,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Change current logged in user password
 */
export async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await getUserById(userId);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'User not found.',
                success: false,
            });
        }

        //new password cant be similar to the previous one.
        if (currentPassword == newPassword) {
            return sendResponse({
                res,
                statusCode: 401,
                message: 'New password cannot be similar to the previous password.',
                success: false,
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Current password is incorrect.',
                success: false,
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updateUser(userId, { password: hashedPassword });

        // Invalidate Redis user cache
        const cacheKey = `user:${userId}`;
        try {
            await redis.del(cacheKey);
        } catch (cacheError) {
            console.error('Redis cache delete error in changePassword:', cacheError);
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Password changed successfully',
            success: true,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Request account recovery (sends OTP if account is deleted)
 */
export async function requestAccountRecovery(req, res, next) {
    try {
        const email = normalizeEmail(req.body?.email);

        if (!email) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email is required.',
                success: false,
            });
        }

        const user = await getDeletedUserByEmail(email);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'No deleted account found for this email address.',
                success: false,
            });
        }

        const now = new Date();
        const recoveryExpiresAt = user.recoveryExpiresAt ? new Date(user.recoveryExpiresAt) : null;
        if (recoveryExpiresAt && now > recoveryExpiresAt) {
            return sendResponse({
                res,
                statusCode: 410,
                success: false,
                message: 'Recovery period has expired.',
            });
        }

        const otpResult = await issueOtp({
            email,
            purpose: OTP_PURPOSES.RECOVER_ACCOUNT,
            subject: 'Recover your account',
            buildHtml: getRecoverAccountOtpHtml,
        });

        if (!otpResult.ok) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Unable to generate recovery OTP.',
                success: false,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'OTP sent to the registered email. Please check your inbox.',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Verify recovery OTP and restore account (isDeleted = false, isActive = true)
 */
export async function verifyAccountRecovery(req, res, next) {
    try {
        const email = normalizeEmail(req.body?.email);
        const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

        if (!email || !otp) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'Email and OTP are required.',
            });
        }

        const user = await getDeletedUserByEmail(email);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'No deleted account found for this email address.',
                success: false,
            });
        }

        const now = new Date();
        const recoveryExpiresAt = user.recoveryExpiresAt ? new Date(user.recoveryExpiresAt) : null;
        if (recoveryExpiresAt && now > recoveryExpiresAt) {
            return sendResponse({
                res,
                statusCode: 410,
                success: false,
                message: 'Recovery period has expired.',
            });
        }

        const verifyResult = await verifyOtp({
            email,
            otp,
            purpose: OTP_PURPOSES.RECOVER_ACCOUNT,
        });

        //TODO: 5 max attempts
        if (!verifyResult.ok) {
            if (verifyResult.reason === 'locked') {
                return sendResponse({
                    res,
                    statusCode: 429,
                    success: false,
                    message: 'Too many attempts. Please request recovery again.',
                });
            }

            if (verifyResult.reason === 'expired') {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'OTP expired.',
                });
            }

            if (verifyResult.reason === 'invalid') {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'Invalid OTP.',
                    attemptsLeft: verifyResult.attemptsLeft,
                    cooldownRemaining: verifyResult.cooldownRemaining,
                });
            }

            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'OTP expired or invalid.',
            });
        }

        // Recover user
        const recoveredUser = await recoverUser(user.id);
        if (!recoveredUser) {
            return sendResponse({
                res,
                statusCode: 500,
                success: false,
                message: 'Unable to recover user account. Please try again.',
            });
        }

        // Invalidate Redis user cache
        const cacheKey = `user:${user.id}`;
        try {
            await redis.del(cacheKey);
        } catch (cacheError) {
            console.error('Redis cache delete error in verifyAccountRecovery:', cacheError);
        }

        // Trigger notification email to inform the user of successful recovery
        try {
            await sendEmail({
                to: email,
                subject: 'Account Recovered Successfully',
                html: getAccountRecoveredHtml(),
                text: 'Your account has been successfully recovered. You can now log in.',
            });
        } catch (emailError) {
            console.error('[Recovery Email] Failed to send confirmation email:', emailError);
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Account recovered successfully! You can now login.',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Handle Google OAuth login callback and redirect to client
 */
export async function googleCallback(req, res, next) {
    try {
        if (!req.user) {
            return res.redirect(
                `${envConfig.CLIENT_ORIGIN}/login?error=Google authentication failed`,
            );
        }

        const token = jwt.sign(
            { id: req.user.id, email: req.user.email, role: req.user.role },
            envConfig.JWT_SECRET,
            { expiresIn: '1d' },
        );

        setTokenCookie(res, token, false);

        // Redirect to frontend dashboard or home
        return res.redirect(`${envConfig.CLIENT_ORIGIN}/`);
    } catch (error) {
        next(error);
    }
}
