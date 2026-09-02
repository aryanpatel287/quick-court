import { deleteExpiredDeletedUsers } from '../../../dao/user.dao.js';

/**
 * Permanently deletes soft-deleted users whose recovery window has expired.
 * Independent service designed to be used with node-cron, background queues, or admin CLI.
 * @returns {Promise<Array>} List of permanently deleted users
 */
export async function cleanupExpiredDeletedUsers() {
    return await deleteExpiredDeletedUsers();
}
