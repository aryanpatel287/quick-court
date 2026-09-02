import { db } from '../config/database.config.js';
import {
    bookings,
    payments,
    bookingStatusHistory,
    courts,
    facilities,
    courtOperatingHours,
    maintenanceBlocks,
    users,
    sports,
} from '../db/schema/schema.js';
import { eq, and, ne, lt, gt, lte, gte, inArray, desc, count } from 'drizzle-orm';

/**
 * Checks if there is any overlapping CONFIRMED booking for a court.
 * Double-Booking Collision Formula: (newStart < existingEnd) AND (newEnd > existingStart)
 *
 * @param {string} courtId
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {string} [excludeBookingId]
 * @param {object} [tx=db]
 * @returns {Promise<object|null>}
 */
export async function findBookingOverlap(
    courtId,
    startTime,
    endTime,
    excludeBookingId = null,
    tx = db,
) {
    const conditions = [
        eq(bookings.courtId, courtId),
        eq(bookings.status, 'CONFIRMED'),
        lt(bookings.startTime, endTime),
        gt(bookings.endTime, startTime),
    ];

    if (excludeBookingId) {
        conditions.push(ne(bookings.id, excludeBookingId));
    }

    const [overlap] = await tx
        .select()
        .from(bookings)
        .where(and(...conditions))
        .limit(1);
    return overlap || null;
}

/**
 * Checks if there is any overlapping maintenance block for a court.
 * Maintenance Collision Formula: (newStart < maintenanceEnd) AND (newEnd > maintenanceStart)
 *
 * @param {string} courtId
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {object} [tx=db]
 * @returns {Promise<object|null>}
 */
export async function findMaintenanceOverlap(courtId, startTime, endTime, tx = db) {
    const [overlap] = await tx
        .select()
        .from(maintenanceBlocks)
        .where(
            and(
                eq(maintenanceBlocks.courtId, courtId),
                lt(maintenanceBlocks.startTime, endTime),
                gt(maintenanceBlocks.endTime, startTime),
            ),
        )
        .limit(1);

    return overlap || null;
}

/**
 * Gets court operating hours configuration for a specific day of week (0-6).
 *
 * @param {string} courtId
 * @param {number} dayOfWeek (0=Sun, 1=Mon, ..., 6=Sat)
 * @param {object} [tx=db]
 * @returns {Promise<object|null>}
 */
export async function getCourtOperatingHoursForDay(courtId, dayOfWeek, tx = db) {
    const [hours] = await tx
        .select()
        .from(courtOperatingHours)
        .where(
            and(
                eq(courtOperatingHours.courtId, courtId),
                eq(courtOperatingHours.dayOfWeek, dayOfWeek),
            ),
        )
        .limit(1);

    return hours || null;
}

/**
 * Gets a court by ID with its facility and sport.
 *
 * @param {string} courtId
 * @param {object} [tx=db]
 * @returns {Promise<object|null>}
 */
export async function getCourtWithFacility(courtId, tx = db) {
    const [result] = await tx
        .select({
            court: courts,
            facility: facilities,
            sport: sports,
        })
        .from(courts)
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .leftJoin(sports, eq(courts.sportId, sports.id))
        .where(eq(courts.id, courtId))
        .limit(1);

    return result || null;
}

/**
 * Creates a booking, initial payment record, and initial status history entry atomically.
 *
 * @param {object} params
 * @param {object} params.bookingData
 * @param {object} params.paymentData
 * @param {object} [params.statusHistoryData]
 * @returns {Promise<{ booking: object, payment: object, statusHistory: object }>}
 */
export async function createBookingTransaction({ bookingData, paymentData, statusHistoryData }) {
    return await db.transaction(async (tx) => {
        // 1. Insert booking
        const [createdBooking] = await tx.insert(bookings).values(bookingData).returning();

        // 2. Insert payment record linked to booking
        const [createdPayment] = await tx
            .insert(payments)
            .values({
                ...paymentData,
                bookingId: createdBooking.id,
            })
            .returning();

        // 3. Insert status history audit trail
        const [createdHistory] = await tx
            .insert(bookingStatusHistory)
            .values({
                bookingId: createdBooking.id,
                changedBy: statusHistoryData?.changedBy || createdBooking.userId,
                oldStatus: null,
                newStatus: createdBooking.status,
                reason: statusHistoryData?.reason || 'Initial booking creation',
            })
            .returning();

        return {
            booking: createdBooking,
            payment: createdPayment,
            statusHistory: createdHistory,
        };
    });
}

/**
 * Retrieves a booking by ID with joined court, facility, user, and payment details.
 *
 * @param {string} bookingId
 * @param {object} [tx=db]
 * @returns {Promise<object|null>}
 */
export async function getBookingByIdWithDetails(bookingId, tx = db) {
    const rows = await tx
        .select({
            booking: bookings,
            court: courts,
            facility: facilities,
            sport: sports,
            user: {
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                role: users.role,
            },
            payment: payments,
        })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .leftJoin(sports, eq(courts.sportId, sports.id))
        .innerJoin(users, eq(bookings.userId, users.id))
        .leftJoin(payments, eq(bookings.id, payments.bookingId))
        .where(eq(bookings.id, bookingId))
        .limit(1);

    return rows[0] || null;
}

/**
 * Retrieves a basic booking record by ID.
 *
 * @param {string} bookingId
 * @param {object} [tx=db]
 * @returns {Promise<object|null>}
 */
export async function getBookingById(bookingId, tx = db) {
    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    return booking || null;
}

/**
 * Retrieves paginated bookings for a specific user with court & facility summaries.
 *
 * @param {string} userId
 * @param {object} options
 * @param {string} [options.status]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @param {object} [tx=db]
 * @returns {Promise<{ bookings: Array<object>, total: number, page: number, limit: number, totalPages: number }>}
 */
export async function getUserBookings(userId, { status, page = 1, limit = 10 } = {}, tx = db) {
    const conditions = [eq(bookings.userId, userId)];

    if (status) {
        const normalizedStatus = status.toUpperCase();
        conditions.push(eq(bookings.status, normalizedStatus));
    }

    const whereClause = and(...conditions);
    const offset = (Math.max(1, page) - 1) * Math.max(1, limit);

    const [totalCountResult] = await tx
        .select({ value: count() })
        .from(bookings)
        .where(whereClause);

    const total = Number(totalCountResult?.value || 0);

    const rows = await tx
        .select({
            booking: bookings,
            court: {
                id: courts.id,
                name: courts.name,
                priceAmount: courts.priceAmount,
            },
            facility: {
                id: facilities.id,
                name: facilities.name,
                addressLine: facilities.addressLine,
                city: facilities.city,
                state: facilities.state,
            },
            sport: sports,
            payment: {
                id: payments.id,
                status: payments.status,
                amount: payments.amount,
                paymentId: payments.paymentId,
                paidAt: payments.paidAt,
            },
        })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .leftJoin(sports, eq(courts.sportId, sports.id))
        .leftJoin(payments, eq(bookings.id, payments.bookingId))
        .where(whereClause)
        .orderBy(desc(bookings.startTime))
        .limit(limit)
        .offset(offset);

    return {
        bookings: rows,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit) || 1,
    };
}

/**
 * Retrieves paginated bookings across all facilities owned by a specific facility owner.
 *
 * @param {string} ownerId
 * @param {object} filters
 * @param {string} [filters.status]
 * @param {boolean} [filters.upcoming]
 * @param {boolean} [filters.past]
 * @param {string} [filters.courtId]
 * @param {string} [filters.facilityId]
 * @param {Date} [filters.startDate]
 * @param {Date} [filters.endDate]
 * @param {number} [filters.page=1]
 * @param {number} [filters.limit=10]
 * @param {object} [tx=db]
 * @returns {Promise<{ bookings: Array<object>, total: number, page: number, limit: number, totalPages: number }>}
 */
export async function getOwnerBookings(
    ownerId,
    { status, upcoming, past, courtId, facilityId, startDate, endDate, page = 1, limit = 10 } = {},
    tx = db,
) {
    const conditions = [eq(facilities.ownerId, ownerId)];
    const now = new Date();

    if (status) {
        conditions.push(eq(bookings.status, status.toUpperCase()));
    }

    if (upcoming) {
        conditions.push(gt(bookings.startTime, now));
    }

    if (past) {
        conditions.push(lte(bookings.endTime, now));
    }

    if (courtId) {
        conditions.push(eq(bookings.courtId, courtId));
    }

    if (facilityId) {
        conditions.push(eq(facilities.id, facilityId));
    }

    if (startDate) {
        conditions.push(gte(bookings.startTime, startDate));
    }

    if (endDate) {
        conditions.push(lte(bookings.endTime, endDate));
    }

    const whereClause = and(...conditions);
    const offset = (Math.max(1, page) - 1) * Math.max(1, limit);

    const [totalCountResult] = await tx
        .select({ value: count() })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(whereClause);

    const total = Number(totalCountResult?.value || 0);

    const rows = await tx
        .select({
            booking: bookings,
            user: {
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
            },
            court: {
                id: courts.id,
                name: courts.name,
                priceAmount: courts.priceAmount,
            },
            facility: {
                id: facilities.id,
                name: facilities.name,
                city: facilities.city,
            },
            sport: sports,
            payment: {
                id: payments.id,
                status: payments.status,
                amount: payments.amount,
                paymentId: payments.paymentId,
                paidAt: payments.paidAt,
            },
        })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .innerJoin(users, eq(bookings.userId, users.id))
        .leftJoin(sports, eq(courts.sportId, sports.id))
        .leftJoin(payments, eq(bookings.id, payments.bookingId))
        .where(whereClause)
        .orderBy(desc(bookings.startTime))
        .limit(limit)
        .offset(offset);

    return {
        bookings: rows,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit) || 1,
    };
}

/**
 * Updates booking status (e.g. CANCELLED or COMPLETED) and writes an audit log in bookingStatusHistory.
 *
 * @param {string} bookingId
 * @param {string} newStatus ('CANCELLED' | 'COMPLETED')
 * @param {object} options
 * @param {Date} [options.cancelledAt]
 * @param {string} [options.cancellationReason]
 * @param {string|null} [options.changedBy]
 * @returns {Promise<object>}
 */
export async function updateBookingStatus(
    bookingId,
    newStatus,
    { cancelledAt = null, cancellationReason = null, changedBy = null } = {},
) {
    return await db.transaction(async (tx) => {
        const [existing] = await tx
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1);

        if (!existing) {
            throw new Error('Booking not found');
        }

        const updatePayload = {
            status: newStatus,
            updatedAt: new Date(),
        };

        if (newStatus === 'CANCELLED') {
            updatePayload.cancelledAt = cancelledAt || new Date();
            updatePayload.cancellationReason = cancellationReason || 'Cancelled by user';
        }

        const [updatedBooking] = await tx
            .update(bookings)
            .set(updatePayload)
            .where(eq(bookings.id, bookingId))
            .returning();

        await tx.insert(bookingStatusHistory).values({
            bookingId,
            changedBy,
            oldStatus: existing.status,
            newStatus,
            reason: cancellationReason || `Status changed from ${existing.status} to ${newStatus}`,
        });

        return updatedBooking;
    });
}

/**
 * Finds all CONFIRMED bookings whose end_time has passed for auto-completion by cron.
 *
 * @param {Date} [currentTime=new Date()]
 * @param {object} [tx=db]
 * @returns {Promise<Array<object>>}
 */
export async function getPastConfirmedBookings(currentTime = new Date(), tx = db) {
    return await tx
        .select()
        .from(bookings)
        .where(and(eq(bookings.status, 'CONFIRMED'), lte(bookings.endTime, currentTime)));
}

/**
 * Batch completes expired confirmed bookings.
 *
 * @param {Array<string>} bookingIds
 * @returns {Promise<number>} Number of completed bookings
 */
export async function batchCompleteBookings(bookingIds) {
    if (!bookingIds || bookingIds.length === 0) return 0;

    return await db.transaction(async (tx) => {
        const updated = await tx
            .update(bookings)
            .set({
                status: 'COMPLETED',
                updatedAt: new Date(),
            })
            .where(and(inArray(bookings.id, bookingIds), eq(bookings.status, 'CONFIRMED')))
            .returning({ id: bookings.id });

        if (updated.length > 0) {
            const historyRecords = updated.map((b) => ({
                bookingId: b.id,
                changedBy: null,
                oldStatus: 'CONFIRMED',
                newStatus: 'COMPLETED',
                reason: 'Auto-completed by system after scheduled end time',
            }));

            await tx.insert(bookingStatusHistory).values(historyRecords);
        }

        return updated.length;
    });
}
