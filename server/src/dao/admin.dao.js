import { db } from '../config/database.config.js';
import { facilities } from '../db/schema/facilities.schema.js';
import { facilityStatusHistory } from '../db/schema/facility_status_history.schema.js';
import { users } from '../db/schema/users.schema.js';
import { courts } from '../db/schema/courts.schema.js';
import { bookings } from '../db/schema/bookings.schema.js';
import { payments } from '../db/schema/payments.schema.js';
import { sports } from '../db/schema/sports.schema.js';
import { eq, and, sql, desc, asc, count, or, ilike, gte, lte, inArray } from 'drizzle-orm';
import { AppError } from '../modules/auth/utils/appError.js';

/**
 * Update facility status inside an atomic database transaction
 * @param {object} params
 */
export async function updateFacilityStatusWithHistory({
    facilityId,
    adminId,
    oldStatus = 'PENDING',
    newStatus,
    comment,
    rejectionReason,
}) {
    return await db.transaction(async (tx) => {
        const [facility] = await tx.select().from(facilities).where(eq(facilities.id, facilityId));

        if (!facility) {
            throw new AppError('Facility not found', 404);
        }

        const currentStatus = String(facility.status).toUpperCase();
        const expectedOldStatus = String(oldStatus).toUpperCase();

        if (currentStatus !== expectedOldStatus) {
            throw new AppError(
                `Facility cannot transition to ${newStatus} from current status '${currentStatus}'. Expected status: '${expectedOldStatus}'.`,
                400,
            );
        }

        const updatePayload = {
            status: newStatus.toUpperCase(),
            updatedAt: new Date(),
        };

        if (rejectionReason !== undefined) {
            updatePayload.rejectionReason = rejectionReason;
        }

        const [updatedFacility] = await tx
            .update(facilities)
            .set(updatePayload)
            .where(eq(facilities.id, facilityId))
            .returning();

        const [historyRecord] = await tx
            .insert(facilityStatusHistory)
            .values({
                facilityId,
                changedBy: adminId,
                oldStatus: currentStatus,
                newStatus: newStatus.toUpperCase(),
                comment: comment || rejectionReason || null,
            })
            .returning();

        return {
            facility: updatedFacility,
            history: historyRecord,
        };
    });
}

/**
 * List facilities filtered by status with owner details & court counts
 * @param {object} options
 */
export async function getFacilitiesByStatus({ status, page = 1, limit = 20, search = '' } = {}) {
    const conditions = [];

    if (status) {
        conditions.push(eq(facilities.status, status.toUpperCase()));
    }

    if (search && search.trim() !== '') {
        const searchPattern = `%${search.trim()}%`;
        conditions.push(
            or(
                ilike(facilities.name, searchPattern),
                ilike(facilities.city, searchPattern),
                ilike(facilities.state, searchPattern),
            ),
        );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const [totalResult] = await db.select({ total: count() }).from(facilities).where(whereClause);

    const total = Number(totalResult?.total || 0);

    const facilityList = await db
        .select({
            id: facilities.id,
            name: facilities.name,
            description: facilities.description,
            addressLine: facilities.addressLine,
            city: facilities.city,
            state: facilities.state,
            postalCode: facilities.postalCode,
            venueType: facilities.venueType,
            status: facilities.status,
            rejectionReason: facilities.rejectionReason,
            createdAt: facilities.createdAt,
            updatedAt: facilities.updatedAt,
            owner: {
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                profileImage: users.profileImage,
            },
        })
        .from(facilities)
        .leftJoin(users, eq(facilities.ownerId, users.id))
        .where(whereClause)
        .orderBy(desc(facilities.createdAt))
        .limit(limitNum)
        .offset(offset);

    return {
        facilities: facilityList,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    };
}

/**
 * Get facility details by ID with owner, courts and status history
 * @param {string} facilityId
 */
export async function getFacilityDetailsById(facilityId) {
    const [facility] = await db
        .select({
            id: facilities.id,
            name: facilities.name,
            description: facilities.description,
            addressLine: facilities.addressLine,
            city: facilities.city,
            state: facilities.state,
            postalCode: facilities.postalCode,
            latitude: facilities.latitude,
            longitude: facilities.longitude,
            venueType: facilities.venueType,
            status: facilities.status,
            rejectionReason: facilities.rejectionReason,
            createdAt: facilities.createdAt,
            updatedAt: facilities.updatedAt,
            owner: {
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                profileImage: users.profileImage,
            },
        })
        .from(facilities)
        .leftJoin(users, eq(facilities.ownerId, users.id))
        .where(eq(facilities.id, facilityId));

    if (!facility) {
        throw new AppError('Facility not found', 404);
    }

    const facilityCourts = await db
        .select({
            id: courts.id,
            name: courts.name,
            priceAmount: courts.priceAmount,
            priceCurrency: courts.priceCurrency,
            isActive: courts.isActive,
            sport: {
                id: sports.id,
                name: sports.name,
                slug: sports.slug,
            },
        })
        .from(courts)
        .leftJoin(sports, eq(courts.sportId, sports.id))
        .where(eq(courts.facilityId, facilityId));

    const statusHistory = await db
        .select({
            id: facilityStatusHistory.id,
            oldStatus: facilityStatusHistory.oldStatus,
            newStatus: facilityStatusHistory.newStatus,
            comment: facilityStatusHistory.comment,
            createdAt: facilityStatusHistory.createdAt,
            admin: {
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
            },
        })
        .from(facilityStatusHistory)
        .leftJoin(users, eq(facilityStatusHistory.changedBy, users.id))
        .where(eq(facilityStatusHistory.facilityId, facilityId))
        .orderBy(desc(facilityStatusHistory.createdAt));

    return {
        ...facility,
        courts: facilityCourts,
        statusHistory,
    };
}

/**
 * Get booking history for a specific user
 * @param {string} userId
 * @param {object} options
 */
export async function getUserBookingHistory(userId, { page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const [totalResult] = await db
        .select({ total: count() })
        .from(bookings)
        .where(eq(bookings.userId, userId));

    const total = Number(totalResult?.total || 0);

    const bookingList = await db
        .select({
            id: bookings.id,
            bookingReference: bookings.bookingReference,
            startTime: bookings.startTime,
            endTime: bookings.endTime,
            durationMinutes: bookings.durationMinutes,
            priceAmount: bookings.priceAmount,
            totalAmount: bookings.totalAmount,
            currency: bookings.totalCurrency,
            status: bookings.status,
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
            },
            payment: {
                id: payments.id,
                status: payments.status,
                amount: payments.amount,
                paidAt: payments.paidAt,
            },
        })
        .from(bookings)
        .leftJoin(courts, eq(bookings.courtId, courts.id))
        .leftJoin(facilities, eq(courts.facilityId, facilities.id))
        .leftJoin(sports, eq(courts.sportId, sports.id))
        .leftJoin(payments, eq(payments.bookingId, bookings.id))
        .where(eq(bookings.userId, userId))
        .orderBy(desc(bookings.createdAt))
        .limit(limitNum)
        .offset(offset);

    return {
        bookings: bookingList,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    };
}

/**
 * Get aggregate admin platform summary metrics
 */
export async function getAdminDashboardSummary() {
    const [userCounts] = await db
        .select({
            totalUsers: sql`COUNT(CASE WHEN ${users.role} = 'USER' AND ${users.isDeleted} = false THEN 1 END)`,
            totalFacilityOwners: sql`COUNT(CASE WHEN ${users.role} = 'FACILITY_OWNER' AND ${users.isDeleted} = false THEN 1 END)`,
        })
        .from(users);

    const [facilityCounts] = await db
        .select({
            totalFacilities: count(),
        })
        .from(facilities);

    const [courtCounts] = await db
        .select({
            totalActiveCourts: count(),
        })
        .from(courts)
        .where(eq(courts.isActive, true));

    const [bookingCounts] = await db
        .select({
            totalBookings: count(),
            totalRevenue: sql`COALESCE(SUM(CASE WHEN ${bookings.status} != 'CANCELLED' THEN ${bookings.totalAmount} ELSE 0 END), 0)`,
        })
        .from(bookings);

    return {
        totalUsers: Number(userCounts?.totalUsers || 0),
        totalFacilityOwners: Number(userCounts?.totalFacilityOwners || 0),
        totalFacilities: Number(facilityCounts?.totalFacilities || 0),
        totalActiveCourts: Number(courtCounts?.totalActiveCourts || 0),
        totalBookings: Number(bookingCounts?.totalBookings || 0),
        totalRevenue: Number(bookingCounts?.totalRevenue || 0),
    };
}

/**
 * Get booking analytics trends (daily, weekly, monthly)
 * @param {object} options
 */
export async function getBookingTrends({ period = 'daily', startDate, endDate } = {}) {
    let dateFormat = 'YYYY-MM-DD';
    if (period === 'weekly') {
        dateFormat = 'IYYY-IW';
    } else if (period === 'monthly') {
        dateFormat = 'YYYY-MM';
    }

    const conditions = [];
    if (startDate) conditions.push(gte(bookings.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(bookings.createdAt, new Date(endDate)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const dateExpr = sql`TO_CHAR(${bookings.createdAt}, ${sql.raw(`'${dateFormat}'`)})`;

    const trends = await db
        .select({
            date: dateExpr,
            bookings: count(),
            revenue: sql`COALESCE(SUM(CASE WHEN ${bookings.status} != 'CANCELLED' THEN ${bookings.totalAmount} ELSE 0 END), 0)`,
        })
        .from(bookings)
        .where(whereClause)
        .groupBy(dateExpr)
        .orderBy(asc(dateExpr));

    return trends.map((item) => ({
        date: item.date,
        bookings: Number(item.bookings || 0),
        revenue: Number(item.revenue || 0),
    }));
}

/**
 * Get user growth trends by role
 * @param {object} options
 */
export async function getUserGrowthTrends({ period = 'daily', startDate, endDate } = {}) {
    let dateFormat = 'YYYY-MM-DD';
    if (period === 'weekly') {
        dateFormat = 'IYYY-IW';
    } else if (period === 'monthly') {
        dateFormat = 'YYYY-MM';
    }

    const conditions = [];
    if (startDate) conditions.push(gte(users.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(users.createdAt, new Date(endDate)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const dateExpr = sql`TO_CHAR(${users.createdAt}, ${sql.raw(`'${dateFormat}'`)})`;

    const trends = await db
        .select({
            date: dateExpr,
            users: sql`COUNT(CASE WHEN ${users.role} = 'USER' THEN 1 END)`,
            facilityOwners: sql`COUNT(CASE WHEN ${users.role} = 'FACILITY_OWNER' THEN 1 END)`,
        })
        .from(users)
        .where(whereClause)
        .groupBy(dateExpr)
        .orderBy(asc(dateExpr));

    return trends.map((item) => ({
        date: item.date,
        users: Number(item.users || 0),
        facilityOwners: Number(item.facilityOwners || 0),
    }));
}

/**
 * Get facility approval/rejection trends based on status history
 * @param {object} options
 */
export async function getFacilityApprovalTrends({ period = 'daily', startDate, endDate } = {}) {
    let dateFormat = 'YYYY-MM-DD';
    if (period === 'weekly') {
        dateFormat = 'IYYY-IW';
    } else if (period === 'monthly') {
        dateFormat = 'YYYY-MM';
    }

    const conditions = [];
    if (startDate) conditions.push(gte(facilityStatusHistory.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(facilityStatusHistory.createdAt, new Date(endDate)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const dateExpr = sql`TO_CHAR(${facilityStatusHistory.createdAt}, ${sql.raw(`'${dateFormat}'`)})`;

    const trends = await db
        .select({
            date: dateExpr,
            approved: sql`COUNT(CASE WHEN ${facilityStatusHistory.newStatus} = 'APPROVED' THEN 1 END)`,
            rejected: sql`COUNT(CASE WHEN ${facilityStatusHistory.newStatus} = 'REJECTED' THEN 1 END)`,
        })
        .from(facilityStatusHistory)
        .where(whereClause)
        .groupBy(dateExpr)
        .orderBy(asc(dateExpr));

    return trends.map((item) => ({
        date: item.date,
        approved: Number(item.approved || 0),
        rejected: Number(item.rejected || 0),
    }));
}

/**
 * Get sports distribution from bookings -> courts -> sports
 */
export async function getSportsDistribution() {
    const [totalBookingsResult] = await db.select({ total: count() }).from(bookings);

    const totalBookings = Number(totalBookingsResult?.total || 0);

    const distribution = await db
        .select({
            sport: sports.name,
            bookings: count(bookings.id),
        })
        .from(sports)
        .leftJoin(courts, eq(courts.sportId, sports.id))
        .leftJoin(bookings, eq(bookings.courtId, courts.id))
        .groupBy(sports.id, sports.name)
        .orderBy(desc(count(bookings.id)));

    return distribution.map((item) => {
        const bookingsCount = Number(item.bookings || 0);
        const percentage =
            totalBookings > 0 ? Number(((bookingsCount / totalBookings) * 100).toFixed(1)) : 0;
        return {
            sport: item.sport,
            bookings: bookingsCount,
            percentage,
        };
    });
}

/**
 * Get platform earnings analytics
 * @param {object} options
 */
export async function getPlatformEarningsSummary({ startDate, endDate } = {}) {
    const paymentConditions = [eq(payments.status, 'SUCCESS')];
    if (startDate) paymentConditions.push(gte(payments.createdAt, new Date(startDate)));
    if (endDate) paymentConditions.push(lte(payments.createdAt, new Date(endDate)));

    const [paymentStats] = await db
        .select({
            totalRevenue: sql`COALESCE(SUM(${payments.amount}), 0)`,
            successfulPayments: count(),
        })
        .from(payments)
        .where(and(...paymentConditions));

    // Calculate current month's revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [monthlyStats] = await db
        .select({
            monthlyRevenue: sql`COALESCE(SUM(${payments.amount}), 0)`,
        })
        .from(payments)
        .where(and(eq(payments.status, 'SUCCESS'), gte(payments.createdAt, startOfMonth)));

    const [bookingStats] = await db
        .select({
            cancelledBookings: sql`COUNT(CASE WHEN ${bookings.status} = 'CANCELLED' THEN 1 END)`,
            completedBookings: sql`COUNT(CASE WHEN ${bookings.status} = 'COMPLETED' THEN 1 END)`,
        })
        .from(bookings);

    return {
        totalRevenue: Number(paymentStats?.totalRevenue || 0),
        monthlyRevenue: Number(monthlyStats?.monthlyRevenue || 0),
        successfulPayments: Number(paymentStats?.successfulPayments || 0),
        cancelledBookings: Number(bookingStats?.cancelledBookings || 0),
        completedBookings: Number(bookingStats?.completedBookings || 0),
    };
}
