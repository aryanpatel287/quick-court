import { db } from '../config/database.config.js';
import { facilities } from '../db/schema/facilities.schema.js';
import { courts } from '../db/schema/courts.schema.js';
import { sports } from '../db/schema/sports.schema.js';
import { bookings } from '../db/schema/bookings.schema.js';
import { users } from '../db/schema/users.schema.js';
import { reviews } from '../db/schema/reviews.schema.js';
import { payments } from '../db/schema/payments.schema.js';
import { bookingStatusHistory } from '../db/schema/booking_status_history.schema.js';
import { eq, and, isNull, sql, inArray, gte, lte, gt, or, desc, asc } from 'drizzle-orm';
import { formatDateToDDMMYYYY } from '../utils/date.utils.js';

/**
 * Common select fields for owner booking objects
 */
const ownerBookingSelect = {
    id: bookings.id,
    bookingReference: bookings.bookingReference,
    startTime: bookings.startTime,
    endTime: bookings.endTime,
    durationMinutes: bookings.durationMinutes,
    priceAmount: bookings.priceAmount,
    priceCurrency: bookings.priceCurrency,
    totalAmount: bookings.totalAmount,
    totalCurrency: bookings.totalCurrency,
    status: bookings.status,
    cancelledAt: bookings.cancelledAt,
    cancellationReason: bookings.cancellationReason,
    createdAt: bookings.createdAt,
    court: {
        id: courts.id,
        name: courts.name,
    },
    facility: {
        id: facilities.id,
        name: facilities.name,
        city: facilities.city,
    },
    sport: {
        id: sports.id,
        name: sports.name,
        slug: sports.slug,
    },
    customer: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImage: users.profileImage,
    },
    payment: {
        id: payments.id,
        status: payments.status,
        amount: payments.amount,
        currency: payments.currency,
        paymentId: payments.paymentId,
        paidAt: payments.paidAt,
    },
};

/**
 * Format a raw database booking row into a clean API response object
 */
function formatOwnerBookingRow(row) {
    return {
        id: row.id,
        bookingReference: row.bookingReference,
        startTime: row.startTime,
        endTime: row.endTime,
        durationMinutes: row.durationMinutes,
        priceAmount: parseFloat(row.priceAmount),
        priceCurrency: row.priceCurrency,
        totalAmount: parseFloat(row.totalAmount),
        totalCurrency: row.totalCurrency,
        status: row.status,
        cancelledAt: row.cancelledAt,
        cancellationReason: row.cancellationReason,
        createdAt: row.createdAt,
        court: row.court,
        facility: row.facility,
        sport: row.sport,
        customer: row.customer,
        payment: row.payment?.id
            ? {
                  id: row.payment.id,
                  status: row.payment.status,
                  amount: parseFloat(row.payment.amount || 0),
                  currency: row.payment.currency || 'INR',
                  paymentId: row.payment.paymentId,
                  paidAt: row.payment.paidAt,
              }
            : null,
    };
}

/**
 * Get all owner bookings with filters and pagination
 *
 * @param {object} params
 * @param {string} params.ownerId - Authenticated owner ID
 * @param {string} [params.facilityId] - Specific facility ID
 * @param {string} [params.courtId] - Specific court ID
 * @param {string} [params.status] - 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
 * @param {Date} [params.startDate]
 * @param {Date} [params.endDate]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 */
export async function getOwnerBookings({
    ownerId,
    facilityId,
    courtId,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 10,
}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const whereConditions = [eq(facilities.ownerId, ownerId), isNull(facilities.deletedAt)];

    if (facilityId) {
        whereConditions.push(eq(facilities.id, facilityId));
    }

    if (courtId) {
        whereConditions.push(eq(courts.id, courtId));
    }

    if (status) {
        whereConditions.push(eq(bookings.status, status.toUpperCase()));
    }

    if (startDate) {
        whereConditions.push(gte(bookings.startTime, startDate));
    }

    if (endDate) {
        whereConditions.push(lte(bookings.startTime, endDate));
    }

    const combinedWhere = and(...whereConditions);

    // Total count query
    const [{ totalCount }] = await db
        .select({ totalCount: sql`COUNT(${bookings.id})::int` })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(combinedWhere);

    // Query rows
    const rows = await db
        .select(ownerBookingSelect)
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .innerJoin(sports, eq(courts.sportId, sports.id))
        .innerJoin(users, eq(bookings.userId, users.id))
        .leftJoin(payments, eq(bookings.id, payments.bookingId))
        .where(combinedWhere)
        .orderBy(desc(bookings.startTime))
        .limit(limitNum)
        .offset(offset);

    const total = parseInt(totalCount, 10) || 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
        bookings: rows.map(formatOwnerBookingRow),
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
        },
    };
}

/**
 * Get upcoming confirmed bookings for owner
 *
 * @param {object} params
 * @param {string} params.ownerId
 * @param {string} [params.facilityId]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 */
export async function getOwnerUpcomingBookings({ ownerId, facilityId, page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;
    const now = new Date();

    const whereConditions = [
        eq(facilities.ownerId, ownerId),
        isNull(facilities.deletedAt),
        eq(bookings.status, 'CONFIRMED'),
        gt(bookings.startTime, now),
    ];

    if (facilityId) {
        whereConditions.push(eq(facilities.id, facilityId));
    }

    const combinedWhere = and(...whereConditions);

    const [{ totalCount }] = await db
        .select({ totalCount: sql`COUNT(${bookings.id})::int` })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(combinedWhere);

    const rows = await db
        .select(ownerBookingSelect)
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .innerJoin(sports, eq(courts.sportId, sports.id))
        .innerJoin(users, eq(bookings.userId, users.id))
        .leftJoin(payments, eq(bookings.id, payments.bookingId))
        .where(combinedWhere)
        .orderBy(asc(bookings.startTime))
        .limit(limitNum)
        .offset(offset);

    const total = parseInt(totalCount, 10) || 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
        bookings: rows.map(formatOwnerBookingRow),
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
        },
    };
}

/**
 * Get past bookings for owner (completed, cancelled, or passed start time)
 *
 * @param {object} params
 * @param {string} params.ownerId
 * @param {string} [params.facilityId]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 */
export async function getOwnerPastBookings({ ownerId, facilityId, page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;
    const now = new Date();

    const whereConditions = [
        eq(facilities.ownerId, ownerId),
        isNull(facilities.deletedAt),
        or(lte(bookings.startTime, now), inArray(bookings.status, ['COMPLETED', 'CANCELLED'])),
    ];

    if (facilityId) {
        whereConditions.push(eq(facilities.id, facilityId));
    }

    const combinedWhere = and(...whereConditions);

    const [{ totalCount }] = await db
        .select({ totalCount: sql`COUNT(${bookings.id})::int` })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(combinedWhere);

    const rows = await db
        .select(ownerBookingSelect)
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .innerJoin(sports, eq(courts.sportId, sports.id))
        .innerJoin(users, eq(bookings.userId, users.id))
        .leftJoin(payments, eq(bookings.id, payments.bookingId))
        .where(combinedWhere)
        .orderBy(desc(bookings.startTime))
        .limit(limitNum)
        .offset(offset);

    const total = parseInt(totalCount, 10) || 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
        bookings: rows.map(formatOwnerBookingRow),
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
        },
    };
}

/**
 * Get bookings for calendar view in a given month and year
 *
 * @param {object} params
 * @param {string} params.ownerId
 * @param {string} [params.facilityId]
 * @param {number} [params.month] - 1 to 12
 * @param {number} [params.year] - e.g. 2026
 * @param {'court'|'flat'} [params.groupBy]
 */
export async function getOwnerCalendarBookings({ ownerId, facilityId, month, year, groupBy }) {
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month, 10) - 1 : new Date().getMonth();

    const startDate = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));

    const whereConditions = [
        eq(facilities.ownerId, ownerId),
        isNull(facilities.deletedAt),
        inArray(bookings.status, ['CONFIRMED', 'COMPLETED']),
        gte(bookings.startTime, startDate),
        lte(bookings.startTime, endDate),
    ];

    if (facilityId) {
        whereConditions.push(eq(facilities.id, facilityId));
    }

    const rows = await db
        .select(ownerBookingSelect)
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .innerJoin(sports, eq(courts.sportId, sports.id))
        .innerJoin(users, eq(bookings.userId, users.id))
        .leftJoin(payments, eq(bookings.id, payments.bookingId))
        .where(and(...whereConditions))
        .orderBy(asc(bookings.startTime));

    const formattedBookings = rows.map(formatOwnerBookingRow);

    const result = {
        month: currentMonth + 1,
        year: currentYear,
        totalBookings: rows.length,
        bookings: formattedBookings,
    };

    if (groupBy === 'court') {
        const courtsMap = {};
        for (const b of formattedBookings) {
            const cId = b.court?.id || 'unknown';
            if (!courtsMap[cId]) {
                courtsMap[cId] = {
                    court: b.court,
                    facility: b.facility,
                    totalBookings: 0,
                    bookings: [],
                };
            }
            courtsMap[cId].totalBookings += 1;
            courtsMap[cId].bookings.push(b);
        }
        result.calendarByCourt = Object.values(courtsMap);
    }

    return result;
}

/**
 * Get dashboard summary KPIs for facility owner
 *
 * @param {string} ownerId
 * @param {string} [facilityId]
 * @returns {Promise<object>}
 */
export async function getOwnerDashboardSummary(ownerId, facilityId) {
    const facilityConditions = [eq(facilities.ownerId, ownerId), isNull(facilities.deletedAt)];
    if (facilityId) {
        facilityConditions.push(eq(facilities.id, facilityId));
    }
    const combinedFacilityWhere = and(...facilityConditions);

    const now = new Date();

    // 1. Total bookings and total earnings (CONFIRMED or COMPLETED)
    const [bookingStats] = await db
        .select({
            totalBookings: sql`COUNT(${bookings.id})::int`,
            totalEarnings: sql`COALESCE(SUM(${bookings.totalAmount}), 0)::numeric(12,2)`,
        })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(and(combinedFacilityWhere, inArray(bookings.status, ['CONFIRMED', 'COMPLETED'])));

    // 2. Upcoming bookings count (CONFIRMED and startTime > NOW)
    const [upcomingStats] = await db
        .select({
            upcomingCount: sql`COUNT(${bookings.id})::int`,
        })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(
            and(
                combinedFacilityWhere,
                eq(bookings.status, 'CONFIRMED'),
                gt(bookings.startTime, now),
            ),
        );

    // 3. Active facilities count
    const [facilitiesStats] = await db
        .select({
            activeFacilities: sql`COUNT(DISTINCT ${facilities.id})::int`,
        })
        .from(facilities)
        .where(and(combinedFacilityWhere, eq(facilities.status, 'APPROVED')));

    // 4. Active courts count
    const [courtsStats] = await db
        .select({
            activeCourts: sql`COUNT(DISTINCT ${courts.id})::int`,
        })
        .from(courts)
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(and(combinedFacilityWhere, eq(courts.isActive, true)));

    // 5. Average rating and total reviews
    const [reviewStats] = await db
        .select({
            averageRating: sql`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 1), 0)`,
            totalReviews: sql`COUNT(${reviews.id})::int`,
        })
        .from(reviews)
        .innerJoin(facilities, eq(reviews.facilityId, facilities.id))
        .where(combinedFacilityWhere);

    return {
        totalBookings: bookingStats ? parseInt(bookingStats.totalBookings, 10) : 0,
        totalEarnings: bookingStats ? parseFloat(bookingStats.totalEarnings) : 0,
        currency: 'INR',
        activeFacilities: facilitiesStats ? parseInt(facilitiesStats.activeFacilities, 10) : 0,
        activeCourts: courtsStats ? parseInt(courtsStats.activeCourts, 10) : 0,
        upcomingBookingsCount: upcomingStats ? parseInt(upcomingStats.upcomingCount, 10) : 0,
        averageRating: reviewStats ? parseFloat(reviewStats.averageRating) : 0,
        totalReviews: reviewStats ? parseInt(reviewStats.totalReviews, 10) : 0,
    };
}

/**
 * Get booking & earnings trends grouped by day, week, or month
 *
 * @param {object} params
 * @param {string} params.ownerId
 * @param {string} [params.facilityId]
 * @param {'daily'|'weekly'|'monthly'} [params.period='daily']
 * @param {Date} [params.startDate]
 * @param {Date} [params.endDate]
 */
export async function getOwnerBookingsTrend({
    ownerId,
    facilityId,
    period = 'daily',
    startDate,
    endDate,
}) {
    const whereConditions = [
        eq(facilities.ownerId, ownerId),
        isNull(facilities.deletedAt),
        inArray(bookings.status, ['CONFIRMED', 'COMPLETED']),
    ];

    if (facilityId) {
        whereConditions.push(eq(facilities.id, facilityId));
    }

    if (startDate) {
        whereConditions.push(gte(bookings.startTime, startDate));
    }

    if (endDate) {
        whereConditions.push(lte(bookings.startTime, endDate));
    }

    let dateTruncField;
    switch (period) {
        case 'weekly':
            dateTruncField = sql`DATE_TRUNC('week', ${bookings.startTime})`;
            break;
        case 'monthly':
            dateTruncField = sql`DATE_TRUNC('month', ${bookings.startTime})`;
            break;
        case 'daily':
        default:
            dateTruncField = sql`DATE_TRUNC('day', ${bookings.startTime})`;
            break;
    }

    const rows = await db
        .select({
            periodBucket: dateTruncField,
            bookingsCount: sql`COUNT(${bookings.id})::int`,
            earnings: sql`COALESCE(SUM(${bookings.totalAmount}), 0)::numeric(12,2)`,
        })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(and(...whereConditions))
        .groupBy(dateTruncField)
        .orderBy(asc(dateTruncField));

    return rows.map((r) => {
        const bucketDate = new Date(r.periodBucket);
        let label;
        if (period === 'monthly') {
            const m = String(bucketDate.getUTCMonth() + 1).padStart(2, '0');
            const y = bucketDate.getUTCFullYear();
            label = `${m}-${y}`;
        } else {
            label = formatDateToDDMMYYYY(bucketDate, '-');
        }

        return {
            date: label,
            bookingsCount: parseInt(r.bookingsCount, 10) || 0,
            earnings: parseFloat(r.earnings) || 0,
        };
    });
}

/**
 * Get detailed earnings breakdown by court, facility, and monthly timeline
 *
 * @param {object} params
 * @param {string} params.ownerId
 * @param {string} [params.facilityId]
 */
export async function getOwnerEarnings({ ownerId, facilityId }) {
    const whereConditions = [
        eq(facilities.ownerId, ownerId),
        isNull(facilities.deletedAt),
        inArray(bookings.status, ['CONFIRMED', 'COMPLETED']),
    ];

    if (facilityId) {
        whereConditions.push(eq(facilities.id, facilityId));
    }

    const combinedWhere = and(...whereConditions);

    // Total earnings
    const [totalRow] = await db
        .select({
            totalEarnings: sql`COALESCE(SUM(${bookings.totalAmount}), 0)::numeric(12,2)`,
            totalBookings: sql`COUNT(${bookings.id})::int`,
        })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(combinedWhere);

    // Earnings by court
    const courtRows = await db
        .select({
            courtId: courts.id,
            courtName: courts.name,
            facilityId: facilities.id,
            facilityName: facilities.name,
            bookingsCount: sql`COUNT(${bookings.id})::int`,
            earnings: sql`COALESCE(SUM(${bookings.totalAmount}), 0)::numeric(12,2)`,
        })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(combinedWhere)
        .groupBy(courts.id, courts.name, facilities.id, facilities.name)
        .orderBy(desc(sql`SUM(${bookings.totalAmount})`));

    // Earnings by facility
    const facilityRows = await db
        .select({
            facilityId: facilities.id,
            facilityName: facilities.name,
            city: facilities.city,
            bookingsCount: sql`COUNT(${bookings.id})::int`,
            earnings: sql`COALESCE(SUM(${bookings.totalAmount}), 0)::numeric(12,2)`,
        })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(combinedWhere)
        .groupBy(facilities.id, facilities.name, facilities.city)
        .orderBy(desc(sql`SUM(${bookings.totalAmount})`));

    // Monthly breakdown (last 12 months)
    const monthlyRows = await db
        .select({
            monthBucket: sql`DATE_TRUNC('month', ${bookings.startTime})`,
            bookingsCount: sql`COUNT(${bookings.id})::int`,
            earnings: sql`COALESCE(SUM(${bookings.totalAmount}), 0)::numeric(12,2)`,
        })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(combinedWhere)
        .groupBy(sql`DATE_TRUNC('month', ${bookings.startTime})`)
        .orderBy(asc(sql`DATE_TRUNC('month', ${bookings.startTime})`));

    return {
        totalEarnings: totalRow ? parseFloat(totalRow.totalEarnings) : 0,
        totalBookings: totalRow ? parseInt(totalRow.totalBookings, 10) : 0,
        currency: 'INR',
        earningsByCourt: courtRows.map((r) => ({
            courtId: r.courtId,
            courtName: r.courtName,
            facilityId: r.facilityId,
            facilityName: r.facilityName,
            bookingsCount: parseInt(r.bookingsCount, 10) || 0,
            earnings: parseFloat(r.earnings) || 0,
        })),
        earningsByFacility: facilityRows.map((r) => ({
            facilityId: r.facilityId,
            facilityName: r.facilityName,
            city: r.city,
            bookingsCount: parseInt(r.bookingsCount, 10) || 0,
            earnings: parseFloat(r.earnings) || 0,
        })),
        monthlyTrend: monthlyRows.map((r) => {
            const d = new Date(r.monthBucket);
            const m = String(d.getUTCMonth() + 1).padStart(2, '0');
            const y = d.getUTCFullYear();
            return {
                month: `${m}-${y}`,
                bookingsCount: parseInt(r.bookingsCount, 10) || 0,
                earnings: parseFloat(r.earnings) || 0,
            };
        }),
    };
}

/**
 * Get peak booking hours distribution (0 to 23)
 *
 * @param {object} params
 * @param {string} params.ownerId
 * @param {string} [params.facilityId]
 */
export async function getOwnerPeakHours({ ownerId, facilityId }) {
    const whereConditions = [
        eq(facilities.ownerId, ownerId),
        isNull(facilities.deletedAt),
        inArray(bookings.status, ['CONFIRMED', 'COMPLETED']),
    ];

    if (facilityId) {
        whereConditions.push(eq(facilities.id, facilityId));
    }

    const rows = await db
        .select({
            hour: sql`EXTRACT(HOUR FROM ${bookings.startTime})::int`,
            bookingsCount: sql`COUNT(${bookings.id})::int`,
        })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(and(...whereConditions))
        .groupBy(sql`EXTRACT(HOUR FROM ${bookings.startTime})`)
        .orderBy(asc(sql`EXTRACT(HOUR FROM ${bookings.startTime})`));

    const countByHour = new Map();
    rows.forEach((r) => {
        countByHour.set(r.hour, parseInt(r.bookingsCount, 10) || 0);
    });

    // Populate full 24-hour array
    const result = [];
    for (let h = 0; h < 24; h++) {
        const nextH = (h + 1) % 24;
        const startLabel = `${String(h).padStart(2, '0')}:00`;
        const endLabel = `${String(nextH).padStart(2, '0')}:00`;
        result.push({
            hour: h,
            label: `${startLabel} - ${endLabel}`,
            bookingsCount: countByHour.get(h) || 0,
        });
    }

    return result;
}

/**
 * Cancels a booking as a facility owner and writes an audit log in bookingStatusHistory.
 *
 * @param {object} params
 * @param {string} params.ownerId - Authenticated owner ID
 * @param {string} params.bookingId - Target booking UUID
 * @param {string} [params.cancellationReason]
 * @returns {Promise<object>} Cancelled booking record
 */
export async function cancelOwnerBooking({ ownerId, bookingId, cancellationReason }) {
    return await db.transaction(async (tx) => {
        const [target] = await tx
            .select({
                booking: bookings,
                facility: facilities,
                court: courts,
            })
            .from(bookings)
            .innerJoin(courts, eq(bookings.courtId, courts.id))
            .innerJoin(facilities, eq(courts.facilityId, facilities.id))
            .where(
                and(
                    eq(bookings.id, bookingId),
                    eq(facilities.ownerId, ownerId),
                    isNull(facilities.deletedAt),
                ),
            )
            .limit(1);

        if (!target) {
            const error = new Error('Booking not found or not authorized for this owner');
            error.statusCode = 404;
            throw error;
        }

        if (target.booking.status === 'CANCELLED') {
            const error = new Error('Booking is already cancelled');
            error.statusCode = 409;
            throw error;
        }

        const reasonText = cancellationReason || 'Cancelled by facility owner';
        const now = new Date();

        const [updatedBooking] = await tx
            .update(bookings)
            .set({
                status: 'CANCELLED',
                cancelledAt: now,
                cancellationReason: reasonText,
                updatedAt: now,
            })
            .where(eq(bookings.id, bookingId))
            .returning();

        await tx.insert(bookingStatusHistory).values({
            bookingId,
            changedBy: ownerId,
            oldStatus: target.booking.status,
            newStatus: 'CANCELLED',
            reason: reasonText,
        });

        return updatedBooking;
    });
}

