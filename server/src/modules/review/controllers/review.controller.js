import {
    getVenueReviews as getVenueReviewsDao,
    getBookingForReview as getBookingForReviewDao,
    getReviewByUserAndBooking as getReviewByUserAndBookingDao,
    createReview as createReviewDao,
    getReviewById as getReviewByIdDao,
    updateReview as updateReviewDao,
    deleteReview as deleteReviewDao,
} from '../../../dao/review.dao.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * Get reviews for an approved venue
 * GET /api/venues/:venueId/reviews
 */
export async function getVenueReviews(req, res, next) {
    try {
        const { venueId } = req.params;
        const { page, limit, sortBy } = req.query;

        const result = await getVenueReviewsDao({
            venueId,
            page,
            limit,
            sortBy,
        });

        if (!result) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Venue not found',
                success: false,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Reviews retrieved successfully',
            success: true,
            reviews: result.reviews,
            summary: result.summary,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Create a review for a completed booking
 * POST /api/venues/:venueId/reviews
 */
export async function createReview(req, res, next) {
    try {
        const { venueId } = req.params;
        const { bookingId, rating, comment } = req.body;
        const userId = req.user.id;

        // 1. Fetch booking with court and facility info
        const booking = await getBookingForReviewDao(bookingId);
        if (!booking) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Booking not found',
                success: false,
            });
        }

        // 2. Verify booking author
        if (booking.userId !== userId) {
            return sendResponse({
                res,
                statusCode: 403,
                message: 'You can only review your own bookings',
                success: false,
            });
        }

        // 3. Verify booking status is COMPLETED
        if (booking.status !== 'COMPLETED') {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Only completed bookings can be reviewed',
                success: false,
            });
        }

        // 4. Verify booking belongs to the specified venue
        if (booking.facilityId !== venueId) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Booking does not belong to this venue',
                success: false,
            });
        }

        // 5. Check if user already reviewed this booking
        const existingReview = await getReviewByUserAndBookingDao(userId, bookingId);
        if (existingReview) {
            return sendResponse({
                res,
                statusCode: 409,
                message: 'You have already reviewed this booking',
                success: false,
            });
        }

        // 6. Insert review
        try {
            const newReview = await createReviewDao({
                facilityId: venueId,
                userId,
                bookingId,
                rating: parseInt(rating, 10),
                comment,
            });

            return sendResponse({
                res,
                statusCode: 201,
                message: 'Review submitted successfully',
                success: true,
                review: newReview,
            });
        } catch (dbError) {
            // Catch PostgreSQL unique constraint violation (code 23505)
            if (dbError.code === '23505') {
                return sendResponse({
                    res,
                    statusCode: 409,
                    message: 'You have already reviewed this booking',
                    success: false,
                });
            }
            throw dbError;
        }
    } catch (error) {
        next(error);
    }
}

/**
 * Update an existing review
 * PATCH /api/reviews/:reviewId
 */
export async function updateReview(req, res, next) {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;

        const review = await getReviewByIdDao(reviewId);
        if (!review) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Review not found',
                success: false,
            });
        }

        // Authorization: Only the author can edit
        if (review.userId !== req.user.id) {
            return sendResponse({
                res,
                statusCode: 403,
                message: 'You can only edit your own reviews',
                success: false,
            });
        }

        const updated = await updateReviewDao(reviewId, {
            rating: rating !== undefined ? parseInt(rating, 10) : undefined,
            comment,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Review updated successfully',
            success: true,
            review: updated,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a review (Author or ADMIN)
 * DELETE /api/reviews/:reviewId
 */
export async function deleteReview(req, res, next) {
    try {
        const { reviewId } = req.params;

        const review = await getReviewByIdDao(reviewId);
        if (!review) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Review not found',
                success: false,
            });
        }

        // Authorization: Author OR role === 'ADMIN'
        const isAuthor = review.userId === req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isAuthor && !isAdmin) {
            return sendResponse({
                res,
                statusCode: 403,
                message: 'You do not have permission to delete this review',
                success: false,
            });
        }

        await deleteReviewDao(reviewId);

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Review deleted successfully',
            success: true,
        });
    } catch (error) {
        next(error);
    }
}
