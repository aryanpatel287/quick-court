import * as userDao from '../../../dao/user.dao.js';
import * as adminDao from '../../../dao/admin.dao.js';
import * as userService from '../services/user.service.js';
import { cleanupExpiredDeletedUsers } from '../services/cleanup.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';
import { AppError } from '../utils/appError.js';

/**
 * List all users with search, role, status filters and pagination
 */
export async function listUsers(req, res, next) {
    try {
        const { role, status, search, page = 1, limit = 20, includeDeleted = 'true' } = req.query;
        const result = await userDao.findUsersWithFilters({
            role,
            status,
            search,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            includeDeleted: includeDeleted === 'true',
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Users retrieved successfully',
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get detailed user information by ID
 */
export async function getUserDetails(req, res, next) {
    try {
        const userId = req.params.userId || req.params.id;
        const user = await userDao.getUserById(userId, true);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'User details retrieved successfully',
            success: true,
            data: {
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    profileImage: user.profileImage,
                    role: user.role,
                    emailVerified: user.emailVerified,
                    isActive: user.isActive,
                    isDeleted: user.isDeleted,
                    deletedAt: user.deletedAt,
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
 * Get user booking history
 */
export async function getUserBookings(req, res, next) {
    try {
        const userId = req.params.userId || req.params.id;
        const { page = 1, limit = 20 } = req.query;

        const user = await userDao.getUserById(userId, true);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const result = await adminDao.getUserBookingHistory(userId, {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'User bookings retrieved successfully',
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Ban a user (set isActive = false)
 */
export async function banUser(req, res, next) {
    try {
        const targetUserId = req.params.userId || req.params.id;
        const currentAdminId = req.user.id;

        if (targetUserId === currentAdminId) {
            throw new AppError('You cannot ban your own administrator account', 400);
        }

        const targetUser = await userDao.getUserById(targetUserId, true);
        if (!targetUser) {
            throw new AppError('User not found', 404);
        }

        if (String(targetUser.role).toUpperCase() === 'ADMIN') {
            throw new AppError('Administrator accounts cannot be banned', 400);
        }

        const updatedUser = await userDao.updateUserActiveStatus(targetUserId, false);

        return sendResponse({
            res,
            statusCode: 200,
            message: 'User has been banned successfully',
            success: true,
            data: {
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    isActive: updatedUser.isActive,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Unban a user (set isActive = true)
 */
export async function unbanUser(req, res, next) {
    try {
        const targetUserId = req.params.userId || req.params.id;

        const targetUser = await userDao.getUserById(targetUserId, true);
        if (!targetUser) {
            throw new AppError('User not found', 404);
        }

        if (targetUser.isDeleted) {
            throw new AppError(
                'Deleted accounts cannot be unbanned. The user must recover the account.',
                400,
            );
        }

        const updatedUser = await userDao.updateUserActiveStatus(targetUserId, true);

        return sendResponse({
            res,
            statusCode: 200,
            message: 'User has been unbanned successfully',
            success: true,
            data: {
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    isActive: updatedUser.isActive,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update user role (Legacy helper)
 */
export async function adminUpdateRole(req, res, next) {
    try {
        const { role } = req.body;
        const targetUserId = req.params.userId || req.params.id;
        const updatedUser = await userService.adminUpdateRole(targetUserId, role);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'User role updated successfully',
            success: true,
            data: {
                user: {
                    id: updatedUser.id,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    isActive: updatedUser.isActive,
                    emailVerified: updatedUser.emailVerified,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Soft delete a user by ID (Legacy helper)
 */
export async function adminDeleteUser(req, res, next) {
    try {
        const targetUserId = req.params.userId || req.params.id;
        await userService.adminDeleteUser(targetUserId);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'User soft-deleted successfully',
            success: true,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Cleanup expired deleted users (Legacy helper)
 */
export async function adminCleanupUsers(req, res, next) {
    try {
        const deletedUsers = await cleanupExpiredDeletedUsers();
        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: `${deletedUsers.length} expired deleted users permanently cleaned up.`,
            deletedUsers: deletedUsers.map((user) => ({
                id: user.id,
                email: user.email,
                deletedAt: user.deletedAt,
                recoveryExpiresAt: user.recoveryExpiresAt,
            })),
        });
    } catch (error) {
        next(error);
    }
}
