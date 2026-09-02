import { db } from '../config/database.config.js';
import { maintenanceBlocks } from '../db/schema/maintenance_blocks.schema.js';
import { courts } from '../db/schema/courts.schema.js';
import { facilities } from '../db/schema/facilities.schema.js';
import { bookings } from '../db/schema/bookings.schema.js';
import { eq, and, asc, desc, lt, gt, gte, lte, ne, isNull } from 'drizzle-orm';

/**
 * Check if a maintenance block belongs to a court owned by the user
 * @param {string} blockId
 * @param {string} ownerId
 * @returns {Promise<boolean>}
 */
export async function isMaintenanceBlockOwner(blockId, ownerId) {
    const [record] = await db
        .select({ id: maintenanceBlocks.id })
        .from(maintenanceBlocks)
        .innerJoin(courts, eq(maintenanceBlocks.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(
            and(
                eq(maintenanceBlocks.id, blockId),
                eq(facilities.ownerId, ownerId),
                isNull(facilities.deletedAt),
            ),
        );
    return Boolean(record);
}

/**
 * Check if the requested maintenance window collides with existing confirmed user bookings
 * Overlap condition: (newStart < existingEnd) AND (newEnd > existingStart)
 * @param {string} courtId
 * @param {Date} startTime
 * @param {Date} endTime
 */
export async function findConflictingBookings(courtId, startTime, endTime) {
    return await db
        .select({
            id: bookings.id,
            bookingReference: bookings.bookingReference,
            startTime: bookings.startTime,
            endTime: bookings.endTime,
            status: bookings.status,
        })
        .from(bookings)
        .where(
            and(
                eq(bookings.courtId, courtId),
                eq(bookings.status, 'CONFIRMED'),
                lt(bookings.startTime, endTime),
                gt(bookings.endTime, startTime),
            ),
        );
}

/**
 * Check if the requested maintenance window collides with another maintenance block
 * @param {string} courtId
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {string} [excludeBlockId]
 */
export async function findConflictingMaintenanceBlocks(
    courtId,
    startTime,
    endTime,
    excludeBlockId = null,
) {
    const conditions = [
        eq(maintenanceBlocks.courtId, courtId),
        lt(maintenanceBlocks.startTime, endTime),
        gt(maintenanceBlocks.endTime, startTime),
    ];

    if (excludeBlockId) {
        conditions.push(ne(maintenanceBlocks.id, excludeBlockId));
    }

    return await db
        .select()
        .from(maintenanceBlocks)
        .where(and(...conditions));
}

/**
 * Create a new maintenance block
 * @param {object} params
 * @param {string} params.courtId
 * @param {string} params.createdBy
 * @param {Date} params.startTime
 * @param {Date} params.endTime
 * @param {string} [params.reason]
 */
export async function createMaintenanceBlock({ courtId, createdBy, startTime, endTime, reason }) {
    const [newBlock] = await db
        .insert(maintenanceBlocks)
        .values({
            courtId,
            createdBy,
            startTime,
            endTime,
            reason: reason || null,
            createdAt: new Date(),
        })
        .returning();

    return newBlock;
}

/**
 * Get maintenance blocks for a court with optional filters
 * @param {string} courtId
 * @param {object} filters
 */
export async function getMaintenanceBlocksByCourt(
    courtId,
    { upcoming = true, startDate, endDate } = {},
) {
    const conditions = [eq(maintenanceBlocks.courtId, courtId)];

    if (upcoming) {
        conditions.push(gte(maintenanceBlocks.endTime, new Date()));
    }

    if (startDate) {
        conditions.push(gte(maintenanceBlocks.startTime, new Date(startDate)));
    }

    if (endDate) {
        conditions.push(lte(maintenanceBlocks.endTime, new Date(endDate)));
    }

    return await db
        .select()
        .from(maintenanceBlocks)
        .where(and(...conditions))
        .orderBy(asc(maintenanceBlocks.startTime));
}

/**
 * Get a maintenance block by ID
 * @param {string} blockId
 */
export async function getMaintenanceBlockById(blockId) {
    const [record] = await db
        .select({
            id: maintenanceBlocks.id,
            courtId: maintenanceBlocks.courtId,
            createdBy: maintenanceBlocks.createdBy,
            startTime: maintenanceBlocks.startTime,
            endTime: maintenanceBlocks.endTime,
            reason: maintenanceBlocks.reason,
            createdAt: maintenanceBlocks.createdAt,
            facilityId: courts.facilityId,
            ownerId: facilities.ownerId,
        })
        .from(maintenanceBlocks)
        .innerJoin(courts, eq(maintenanceBlocks.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(eq(maintenanceBlocks.id, blockId));

    return record || null;
}

/**
 * Delete a maintenance block
 * @param {string} blockId
 */
export async function deleteMaintenanceBlock(blockId) {
    const [deleted] = await db
        .delete(maintenanceBlocks)
        .where(eq(maintenanceBlocks.id, blockId))
        .returning();

    return deleted || null;
}
