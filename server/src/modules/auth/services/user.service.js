import bcrypt from 'bcryptjs';
import {
    getUserByEmail,
    getUserById,
    updateUser,
    softDeleteUser,
    listUsers,
} from '../../../dao/user.dao.js';
import { issueOtp, OTP_PURPOSES, getOtpHtml, normalizeEmail } from '../../../utils/otp.utils.js';
import { AppError } from '../utils/appError.js';

/**
 * Update current user profile
 * @param {string} userId
 * @param {object} updates name, email, profileImage
 * @returns {object} updated user
 */
export async function updateProfile(userId, { email, firstName, lastName, profileImage }) {
    const user = await getUserById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const updates = {};
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (firstName) updates.firstName = firstName.trim();
    if (lastName) updates.lastName = lastName.trim();

    if (email) {
        const normalizedEmail = normalizeEmail(email);
        if (normalizedEmail && normalizedEmail !== user.email) {
            const existingUser = await getUserByEmail(normalizedEmail);
            if (existingUser && existingUser.id !== userId) {
                throw new AppError('Email is already in use by another account', 400);
            }
            updates.email = normalizedEmail;
            updates.emailVerified = false;

            await issueOtp({
                email: normalizedEmail,
                purpose: OTP_PURPOSES.VERIFY_EMAIL,
                subject: 'QuickCourt Verify Your New Email',
                buildHtml: getOtpHtml,
            });
        }
    }

    const updatedUser = await updateUser(userId, updates);
    if (!updatedUser) {
        throw new AppError('User not found', 404);
    }
    return updatedUser;
}

/**
 * Change current user password
 * @param {string} userId
 * @param {object} param1 currentPassword, newPassword
 */
export async function changePassword(userId, { currentPassword, newPassword }) {
    const user = await getUserById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new AppError('Current password is incorrect', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await updateUser(userId, { password: hashedPassword });
}

/**
 * Soft delete own user account
 * @param {string} userId
 * @param {string} [password]
 */
export async function deleteAccount(userId, password) {
    const user = await getUserById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (password && user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AppError('Incorrect password', 400);
        }
    }

    const deletedUser = await softDeleteUser(userId);
    if (!deletedUser) {
        throw new AppError('User not found or already deleted', 404);
    }
    return deletedUser;
}

/**
 * Get user by id (Admin helper)
 * @param {string} id
 */
export async function adminGetUserById(id) {
    const user = await getUserById(id, true);
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
}

/**
 * List users (Admin helper)
 * @param {boolean} includeDeleted
 */
export async function adminListUsers(includeDeleted = false) {
    return listUsers(includeDeleted);
}

/**
 * Change a user's role (Admin helper)
 * @param {string} targetUserId
 * @param {string} newRole
 */
export async function adminUpdateRole(targetUserId, newRole) {
    const user = await updateUser(targetUserId, { role: newRole });
    if (!user) {
        throw new AppError('User not found', 404);
    }
    return user;
}

/**
 * Soft delete user by ID (Admin helper)
 * @param {string} targetUserId
 */
export async function adminDeleteUser(targetUserId) {
    const user = await softDeleteUser(targetUserId);
    if (!user) {
        throw new AppError('User not found or already deleted', 404);
    }
    return user;
}
