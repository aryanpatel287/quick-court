import { db } from '../config/database.config.js';
import { reviews } from '../db/schema/reviews.schema.js';
import { users } from '../db/schema/users.schema.js';
import { facilities } from '../db/schema/facilities.schema.js';
import { bookings } from '../db/schema/bookings.schema.js';
import { courts } from '../db/schema/courts.schema.js';
import { eq, and, isNull, sql, desc, asc } from 'drizzle-orm';

/**
 * Get public reviews for an approved venue with rating distribution and pagination
 *
 * @param {object} params
 * @param {string} params.venueId
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {'newest'|'highest'|'lowest'} [params.sortBy='newest']
 * @returns {Promise<object|null>}
 */
export async function getVenueReviews({ venueId, page = 1, limit = 10, sortBy = 'newest' }) {
    // 1. Verify approved venue exists
    const [facility] = await db
        .select({ id: facilities.id })
        .from(facilities)
        .where(
            and(
                eq(facilities.id, venueId),
                eq(facilities.status, 'APPROVED'),
                isNull(facilities.deletedAt),
            ),
        );

    if (!facility) {
        return null;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    // 2. Summary stats & distribution
    const [stats] = await db
        .select({
            averageRating: sql`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 1), 0)`,
            totalReviews: sql`COUNT(${reviews.id})::int`,
            count5: sql`COUNT(CASE WHEN ${reviews.rating} = 5 THEN 1 END)::int`,
            count4: sql`COUNT(CASE WHEN ${reviews.rating} = 4 THEN 1 END)::int`,
            count3: sql`COUNT(CASE WHEN ${reviews.rating} = 3 THEN 1 END)::int`,
            count2: sql`COUNT(CASE WHEN ${reviews.rating} = 2 THEN 1 END)::int`,
            count1: sql`COUNT(CASE WHEN ${reviews.rating} = 1 THEN 1 END)::int`,
        })
        .from(reviews)
        .where(eq(reviews.facilityId, venueId));

    // 3. Sorting order
    let orderByClause;
    switch (sortBy) {
        case 'highest':
            orderByClause = [desc(reviews.rating), desc(reviews.createdAt)];
            break;
        case 'lowest':
            orderByClause = [asc(reviews.rating), desc(reviews.createdAt)];
            break;
        case 'newest':
        default:
            orderByClause = [desc(reviews.createdAt)];
            break;
    }

    // 4. Paginated reviews list
    const rows = await db
        .select({
            id: reviews.id,
            rating: reviews.rating,
            comment: reviews.comment,
            createdAt: reviews.createdAt,
            updatedAt: reviews.updatedAt,
            user: {
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                profileImage: users.profileImage,
            },
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.facilityId, venueId))
        .orderBy(...orderByClause)
        .limit(limitNum)
        .offset(offset);

    const total = stats ? parseInt(stats.totalReviews, 10) : 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
        reviews: rows,
        summary: {
            averageRating: stats ? parseFloat(stats.averageRating) : 0,
            totalReviews: total,
            ratingDistribution: {
                5: stats ? parseInt(stats.count5, 10) : 0,
                4: stats ? parseInt(stats.count4, 10) : 0,
                3: stats ? parseInt(stats.count3, 10) : 0,
                2: stats ? parseInt(stats.count2, 10) : 0,
                1: stats ? parseInt(stats.count1, 10) : 0,
            },
        },
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
 * Get booking details for review eligibility verification
 *
 * @param {string} bookingId
 * @returns {Promise<object|null>}
 */
export async function getBookingForReview(bookingId) {
    const [booking] = await db
        .select({
            id: bookings.id,
            userId: bookings.userId,
            status: bookings.status,
            courtId: bookings.courtId,
            facilityId: courts.facilityId,
            facilityStatus: facilities.status,
            facilityDeletedAt: facilities.deletedAt,
        })
        .from(bookings)
        .innerJoin(courts, eq(bookings.courtId, courts.id))
        .innerJoin(facilities, eq(courts.facilityId, facilities.id))
        .where(eq(bookings.id, bookingId));

    return booking || null;
}

/**
 * Check if a review already exists for a user and booking
 *
 * @param {string} userId
 * @param {string} bookingId
 * @returns {Promise<object|null>}
 */
export async function getReviewByUserAndBooking(userId, bookingId) {
    const [record] = await db
        .select()
        .from(reviews)
        .where(and(eq(reviews.userId, userId), eq(reviews.bookingId, bookingId)));
    return record || null;
}

/**
 * Create a new review
 *
 * @param {object} params
 * @param {string} params.facilityId
 * @param {string} params.userId
 * @param {string} params.bookingId
 * @param {number} params.rating
 * @param {string} [params.comment]
 * @returns {Promise<object>}
 */
export async function createReview({ facilityId, userId, bookingId, rating, comment }) {
    const [created] = await db
        .insert(reviews)
        .values({
            facilityId,
            userId,
            bookingId,
            rating,
            comment: comment || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning();

    return created;
}

/**
 * Get review by ID
 *
 * @param {string} reviewId
 * @returns {Promise<object|null>}
 */
export async function getReviewById(reviewId) {
    const [review] = await db
        .select({
            id: reviews.id,
            facilityId: reviews.facilityId,
            userId: reviews.userId,
            bookingId: reviews.bookingId,
            rating: reviews.rating,
            comment: reviews.comment,
            createdAt: reviews.createdAt,
            updatedAt: reviews.updatedAt,
            user: {
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                profileImage: users.profileImage,
            },
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.id, reviewId));

    return review || null;
}

/**
 * Update a review's rating and comment
 *
 * @param {string} reviewId
 * @param {object} updates
 * @param {number} [updates.rating]
 * @param {string} [updates.comment]
 * @returns {Promise<object|null>}
 */
export async function updateReview(reviewId, { rating, comment }) {
    const updateData = { updatedAt: new Date() };
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;

    const [updated] = await db
        .update(reviews)
        .set(updateData)
        .where(eq(reviews.id, reviewId))
        .returning();

    return updated || null;
}

/**
 * Delete a review by ID
 *
 * @param {string} reviewId
 * @returns {Promise<object|null>}
 */
export async function deleteReview(reviewId) {
    const [deleted] = await db.delete(reviews).where(eq(reviews.id, reviewId)).returning();

    return deleted || null;
}
