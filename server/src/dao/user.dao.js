import { db } from '../config/database.config.js';
import { users } from '../db/schema/users.schema.js';
import { eq, and, lt, or, ilike, sql, count, desc } from 'drizzle-orm';

/**
 * Get user by email
 * @param {string} email
 * @param {boolean} includeDeleted
 */
export async function getUserByEmail(email, includeDeleted = false) {
    const filters = [eq(users.email, email)];
    if (!includeDeleted) {
        filters.push(eq(users.isDeleted, false));
    }
    const [user] = await db
        .select()
        .from(users)
        .where(and(...filters));
    return user || null;
}

export const findUserByEmail = getUserByEmail;

/**
 * Get user by ID
 * @param {string} id
 * @param {boolean} includeDeleted
 */
export async function getUserById(id, includeDeleted = false) {
    const filters = [eq(users.id, id)];
    if (!includeDeleted) {
        filters.push(eq(users.isDeleted, false));
    }
    const [user] = await db
        .select()
        .from(users)
        .where(and(...filters));
    return user || null;
}

export const findUserById = getUserById;

/**
 * Get user by googleId
 * @param {string} googleId
 * @param {boolean} includeDeleted
 */
export async function getUserByGoogleId(googleId, includeDeleted = false) {
    const filters = [eq(users.googleId, googleId)];
    if (!includeDeleted) {
        filters.push(eq(users.isDeleted, false));
    }
    const [user] = await db
        .select()
        .from(users)
        .where(and(...filters));
    return user || null;
}

/**
 * Create a new user record
 * @param {object} userData
 */
export async function createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
}

/**
 * Mark a user's email as verified
 * @param {string} email
 */
export async function verifyUserEmail(email) {
    const [user] = await db
        .update(users)
        .set({
            emailVerified: true,
            updatedAt: new Date(),
        })
        .where(eq(users.email, email))
        .returning();
    return user || null;
}

/**
 * Update user details
 * @param {string} id
 * @param {object} updates
 */
export async function updateUser(id, updates) {
    const [user] = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(users.id, id), eq(users.isDeleted, false)))
        .returning();
    return user || null;
}

export const updateUserProfile = updateUser;

/**
 * Update user active status (for ban/unban)
 * @param {string} id
 * @param {boolean} isActive
 */
export async function updateUserActiveStatus(id, isActive) {
    const [user] = await db
        .update(users)
        .set({
            isActive,
            updatedAt: new Date(),
        })
        .where(and(eq(users.id, id), eq(users.isDeleted, false)))
        .returning();
    return user || null;
}

/**
 * Soft delete user
 * @param {string} id
 */
export async function softDeleteUser(id) {
    const deletedAt = new Date();
    const recoveryExpiresAt = new Date(deletedAt.getTime() + 15 * 24 * 60 * 60 * 1000); // today + 15 days
    const [user] = await db
        .update(users)
        .set({
            isDeleted: true,
            isActive: false,
            deletedAt: deletedAt,
            recoveryExpiresAt: recoveryExpiresAt,
            updatedAt: new Date(),
        })
        .where(and(eq(users.id, id), eq(users.isDeleted, false)))
        .returning();
    return user || null;
}

/**
 * List all users
 * @param {boolean} includeDeleted
 */
export async function listUsers(includeDeleted = false) {
    if (includeDeleted) {
        return db.select().from(users);
    }
    return db.select().from(users).where(eq(users.isDeleted, false));
}

/**
 * Find users with advanced filters, search, and pagination
 * @param {object} options
 */
export async function findUsersWithFilters({
    search = '',
    role = '',
    status = '',
    page = 1,
    limit = 20,
    includeDeleted = true,
} = {}) {
    const conditions = [];

    if (!includeDeleted) {
        conditions.push(eq(users.isDeleted, false));
    }

    if (role) {
        const normalizedRole = role.toUpperCase();
        conditions.push(eq(users.role, normalizedRole));
    }

    if (status) {
        if (status.toLowerCase() === 'active') {
            conditions.push(eq(users.isActive, true));
            conditions.push(eq(users.isDeleted, false));
        } else if (status.toLowerCase() === 'banned') {
            conditions.push(eq(users.isActive, false));
            conditions.push(eq(users.isDeleted, false));
        } else if (status.toLowerCase() === 'deleted') {
            conditions.push(eq(users.isDeleted, true));
        }
    }

    if (search && search.trim() !== '') {
        const searchPattern = `%${search.trim()}%`;
        conditions.push(
            or(
                ilike(users.firstName, searchPattern),
                ilike(users.lastName, searchPattern),
                ilike(users.email, searchPattern),
            ),
        );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const [totalCountResult] = await db.select({ total: count() }).from(users).where(whereClause);

    const total = Number(totalCountResult?.total || 0);

    const userList = await db
        .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImage: users.profileImage,
            role: users.role,
            emailVerified: users.emailVerified,
            isActive: users.isActive,
            isDeleted: users.isDeleted,
            deletedAt: users.deletedAt,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limitNum)
        .offset(offset);

    return {
        users: userList,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    };
}

/**
 * Get user by email specifically if they are soft-deleted
 * @param {string} email
 */
export async function getDeletedUserByEmail(email) {
    const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.isDeleted, true)));
    return user || null;
}

/**
 * Recover a soft-deleted user
 * @param {string} id
 */
export async function recoverUser(id) {
    const [user] = await db
        .update(users)
        .set({
            isDeleted: false,
            isActive: true,
            deletedAt: null,
            recoveryExpiresAt: null,
            updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
    return user || null;
}

/**
 * Permanently delete expired soft-deleted users
 * @returns {Promise<Array>} deleted users
 */
export async function deleteExpiredDeletedUsers() {
    const deleted = await db
        .delete(users)
        .where(and(eq(users.isDeleted, true), lt(users.recoveryExpiresAt, new Date())))
        .returning();
    return deleted;
}
