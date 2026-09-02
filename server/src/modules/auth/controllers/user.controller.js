import * as userService from '../services/user.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';
import { uploadImageOnImageKit } from '../../../services/image.service.js';
import redis from '../../../config/cache.config.js';

/**
 * Get current logged in user details
 */
export async function getMe(req, res, next) {
    try {
        const user = req.user;
        return sendResponse({
            res,
            statusCode: 200,
            message: 'User retrieved successfully',
            success: true,
            data: {
                user: {
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
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update current user profile details
 */
export async function updateProfile(req, res, next) {
    try {
        const { email, firstName, lastName, profileImage } = req.body;
        const updatedUser = await userService.updateProfile(req.user.id, {
            email,
            firstName,
            lastName,
            profileImage,
        });
        // Invalidate Redis user cache
        const cacheKey = `user:${req.user.id}`;
        try {
            await redis.del(cacheKey);
        } catch (cacheError) {
            console.error('Redis cache delete error in updateProfile:', cacheError);
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Profile updated successfully',
            success: true,
            data: {
                user: {
                    id: updatedUser.id,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    profileImage: updatedUser.profileImage,
                    isActive: updatedUser.isActive,
                    emailVerified: updatedUser.emailVerified,
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.updatedAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Change current user password
 */
export async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;
        await userService.changePassword(req.user.id, { currentPassword, newPassword });
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
 * Soft delete own user account
 */
export async function deleteAccount(req, res, next) {
    try {
        const { password } = req.body;
        await userService.deleteAccount(req.user.id, password);
        res.clearCookie('token');

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Account deleted successfully',
            success: true,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Upload profile avatar and update user's profileImage URL
 */
export async function uploadAvatar(req, res, next) {
    try {
        if (!req.file) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'No avatar image received. Send image file under the "avatar" field.',
            });
        }

        const uploadedFile = await uploadImageOnImageKit({ image: req.file });
        const imageUrl = uploadedFile.url;

        // Also update the database profileImage for the user
        const updatedUser = await userService.updateProfile(req.user.id, {
            profileImage: imageUrl,
        });

        // Invalidate Redis user cache
        const cacheKey = `user:${req.user.id}`;
        try {
            await redis.del(cacheKey);
        } catch (cacheError) {
            console.error('Redis cache delete error in uploadAvatar:', cacheError);
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Avatar uploaded and profile updated successfully',
            data: {
                imageUrl,
                user: {
                    id: updatedUser.id,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    profileImage: updatedUser.profileImage,
                    isActive: updatedUser.isActive,
                    emailVerified: updatedUser.emailVerified,
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.updatedAt,
                },
            },
        });
    } catch (err) {
        next(err);
    }
}
