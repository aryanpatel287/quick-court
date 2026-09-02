import { db } from '../config/database.config.js';
import { courts } from '../db/schema/courts.schema.js';
import { facilities } from '../db/schema/facilities.schema.js';
import { sports } from '../db/schema/sports.schema.js';
import { facilitySports } from '../db/schema/facility_sports.schema.js';
import { courtOperatingHours } from '../db/schema/court_operating_hours.schema.js';
import { maintenanceBlocks } from '../db/schema/maintenance_blocks.schema.js';
import { bookings } from '../db/schema/bookings.schema.js';
import { eq, and, sql, asc, gt, ne, isNull } from 'drizzle-orm';

/**
 * Check if a court belongs to a facility owned by the specified user
 * @param {string} courtId
 * @param {string} ownerId
 * @returns {Promise<boolean>}
 */
export async function isCourtOwner(courtId, ownerId) {
    const [record] = await db
        .select({ id: courts.id })
        .from(courts)
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(
            and(
                eq(courts.id, courtId),
                eq(facilities.ownerId, ownerId),
                isNull(facilities.deletedAt),
            ),
        );
    return Boolean(record);
}

/**
 * Check if court name is already taken inside a specific facility
 * @param {string} facilityId
 * @param {string} courtName
 * @param {string} [excludeCourtId]
 * @returns {Promise<boolean>}
 */
export async function isCourtNameTakenInFacility(facilityId, courtName, excludeCourtId = null) {
    const conditions = [
        eq(courts.facilityId, facilityId),
        sql`LOWER(${courts.name}) = LOWER(${courtName.trim()})`,
    ];

    if (excludeCourtId) {
        conditions.push(ne(courts.id, excludeCourtId));
    }

    const [record] = await db
        .select({ id: courts.id })
        .from(courts)
        .where(and(...conditions));

    return Boolean(record);
}

/**
 * Verify that a sport is configured for a facility
 * @param {string} facilityId
 * @param {string} sportId
 * @returns {Promise<boolean>}
 */
export async function isSportSupportedByFacility(facilityId, sportId) {
    const [record] = await db
        .select({ facilityId: facilitySports.facilityId })
        .from(facilitySports)
        .where(and(eq(facilitySports.facilityId, facilityId), eq(facilitySports.sportId, sportId)));
    return Boolean(record);
}

/**
 * Create court and initialize 7-day operating hours
 * @param {object} courtData
 * @param {Array} [customOperatingHours]
 * @returns {Promise<object>}
 */
export async function createCourt(courtData, customOperatingHours = null) {
    return await db.transaction(async (tx) => {
        const [newCourt] = await tx
            .insert(courts)
            .values({
                ...courtData,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        // Standard 7-day operating hours (0 = Sunday, 1 = Monday, ... 6 = Saturday)
        const defaultHours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            courtId: newCourt.id,
            dayOfWeek: day,
            startTime: '06:00:00',
            endTime: '22:00:00',
            isClosed: false,
        }));

        const hoursToInsert =
            Array.isArray(customOperatingHours) && customOperatingHours.length > 0
                ? customOperatingHours.map((h) => ({
                      courtId: newCourt.id,
                      dayOfWeek: h.dayOfWeek,
                      startTime: h.isClosed ? null : h.startTime,
                      endTime: h.isClosed ? null : h.endTime,
                      isClosed: Boolean(h.isClosed),
                  }))
                : defaultHours;

        const insertedHours = await tx
            .insert(courtOperatingHours)
            .values(hoursToInsert)
            .returning();

        return {
            ...newCourt,
            operatingHours: insertedHours,
        };
    });
}

/**
 * Get all courts for a facility
 * @param {string} facilityId
 * @param {object} filters
 */
export async function getCourtsByFacilityId(facilityId, { isActive, sportId } = {}) {
    const conditions = [eq(courts.facilityId, facilityId)];

    if (isActive !== undefined) {
        conditions.push(eq(courts.isActive, Boolean(isActive)));
    }

    if (sportId) {
        conditions.push(eq(courts.sportId, sportId));
    }

    return await db
        .select({
            id: courts.id,
            facilityId: courts.facilityId,
            name: courts.name,
            sportId: courts.sportId,
            sportName: sports.name,
            sportSlug: sports.slug,
            priceAmount: courts.priceAmount,
            priceCurrency: courts.priceCurrency,
            isActive: courts.isActive,
            createdAt: courts.createdAt,
            updatedAt: courts.updatedAt,
        })
        .from(courts)
        .innerJoin(sports, eq(courts.sportId, sports.id))
        .where(and(...conditions))
        .orderBy(asc(courts.name));
}

/**
 * Get court details including sport, operating hours, and upcoming maintenance
 * @param {string} courtId
 */
export async function getCourtByIdWithRelations(courtId) {
    const [court] = await db
        .select({
            id: courts.id,
            facilityId: courts.facilityId,
            facilityOwnerId: facilities.ownerId,
            facilityName: facilities.name,
            facilityStatus: facilities.status,
            name: courts.name,
            sportId: courts.sportId,
            sportName: sports.name,
            sportSlug: sports.slug,
            priceAmount: courts.priceAmount,
            priceCurrency: courts.priceCurrency,
            isActive: courts.isActive,
            createdAt: courts.createdAt,
            updatedAt: courts.updatedAt,
        })
        .from(courts)
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .innerJoin(sports, eq(courts.sportId, sports.id))
        .where(eq(courts.id, courtId));

    if (!court) return null;

    const operatingHoursList = await db
        .select()
        .from(courtOperatingHours)
        .where(eq(courtOperatingHours.courtId, courtId))
        .orderBy(asc(courtOperatingHours.dayOfWeek));

    const upcomingMaintenance = await db
        .select()
        .from(maintenanceBlocks)
        .where(
            and(eq(maintenanceBlocks.courtId, courtId), gt(maintenanceBlocks.endTime, new Date())),
        )
        .orderBy(asc(maintenanceBlocks.startTime));

    return {
        ...court,
        operatingHours: operatingHoursList,
        upcomingMaintenance,
    };
}

/**
 * Update court properties
 * @param {string} courtId
 * @param {object} updates
 */
export async function updateCourt(courtId, updates) {
    const [updated] = await db
        .update(courts)
        .set({
            ...updates,
            updatedAt: new Date(),
        })
        .where(eq(courts.id, courtId))
        .returning();
    return updated || null;
}

/**
 * Delete a court record
 * @param {string} courtId
 */
export async function deleteCourt(courtId) {
    const [deleted] = await db.delete(courts).where(eq(courts.id, courtId)).returning();
    return deleted || null;
}

/**
 * Soft deactivate a court
 * @param {string} courtId
 */
export async function deactivateCourt(courtId) {
    const [updated] = await db
        .update(courts)
        .set({
            isActive: false,
            updatedAt: new Date(),
        })
        .where(eq(courts.id, courtId))
        .returning();
    return updated || null;
}

/**
 * Check if court has confirmed future bookings
 * @param {string} courtId
 * @returns {Promise<boolean>}
 */
export async function hasFutureBookings(courtId) {
    const [record] = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(
            and(
                eq(bookings.courtId, courtId),
                eq(bookings.status, 'CONFIRMED'),
                gt(bookings.startTime, new Date()),
            ),
        )
        .limit(1);

    return Boolean(record);
}

/**
 * Check if any court in a facility has confirmed future bookings
 * @param {string} facilityId
 * @returns {Promise<boolean>}
 */
export async function hasActiveOrFutureBookingsForFacility(facilityId) {
    const [record] = await db
        .select({ id: bookings.id })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .where(
            and(
                eq(courts.facilityId, facilityId),
                eq(bookings.status, 'CONFIRMED'),
                gt(bookings.startTime, new Date()),
            ),
        )
        .limit(1);

    return Boolean(record);
}
