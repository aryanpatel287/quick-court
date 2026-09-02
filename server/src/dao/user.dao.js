import { db } from '../config/database.config.js';
import { users } from '../db/schema/users.schema.js';
import { eq, and, lt } from 'drizzle-orm';

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
