import {
    getOwnerBookings as getOwnerBookingsDao,
    getOwnerUpcomingBookings as getOwnerUpcomingBookingsDao,
    getOwnerPastBookings as getOwnerPastBookingsDao,
    getOwnerCalendarBookings as getOwnerCalendarBookingsDao,
    cancelOwnerBooking as cancelOwnerBookingDao,
} from '../../../dao/analytics.dao.js';
import { sendResponse } from '../../../utils/response.utlis.js';
import { parseDDMMYYYY } from '../../../utils/date.utils.js';

/**
 * List all bookings for facility owner
 * GET /api/owner/bookings
 */
export async function getOwnerBookings(req, res, next) {
    try {
        const { facilityId, courtId, status, startDate, endDate, page, limit } = req.query;

        const result = await getOwnerBookingsDao({
            ownerId: req.user.id,
            facilityId,
            courtId,
            status,
            startDate: startDate ? parseDDMMYYYY(startDate) : undefined,
            endDate: endDate ? parseDDMMYYYY(endDate) : undefined,
            page,
            limit,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Owner bookings retrieved successfully',
            success: true,
            bookings: result.bookings,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * List upcoming confirmed bookings for facility owner
 * GET /api/owner/bookings/upcoming
 */
export async function getOwnerUpcomingBookings(req, res, next) {
    try {
        const { facilityId, page, limit } = req.query;

        const result = await getOwnerUpcomingBookingsDao({
            ownerId: req.user.id,
            facilityId,
            page,
            limit,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Upcoming bookings retrieved successfully',
            success: true,
            bookings: result.bookings,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * List past bookings for facility owner
 * GET /api/owner/bookings/past
 */
export async function getOwnerPastBookings(req, res, next) {
    try {
        const { facilityId, page, limit } = req.query;

        const result = await getOwnerPastBookingsDao({
            ownerId: req.user.id,
            facilityId,
            page,
            limit,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Past bookings retrieved successfully',
            success: true,
            bookings: result.bookings,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get monthly calendar bookings for facility owner
 * GET /api/owner/bookings/calendar
 */
export async function getOwnerCalendarBookings(req, res, next) {
    try {
        const { facilityId, month, year, groupBy } = req.query;

        const result = await getOwnerCalendarBookingsDao({
            ownerId: req.user.id,
            facilityId,
            month: month ? parseInt(month, 10) : undefined,
            year: year ? parseInt(year, 10) : undefined,
            groupBy,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Calendar bookings retrieved successfully',
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Cancel a booking as a facility owner
 * PATCH /api/owner/bookings/:bookingId/cancel
 */
export async function cancelOwnerBooking(req, res, next) {
    try {
        const { bookingId } = req.params;
        const { cancellationReason } = req.body || {};

        const updatedBooking = await cancelOwnerBookingDao({
            ownerId: req.user.id,
            bookingId,
            cancellationReason,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Booking cancelled successfully by facility owner',
            success: true,
            data: {
                booking: updatedBooking,
            },
        });
    } catch (error) {
        if (error.statusCode) {
            return sendResponse({
                res,
                statusCode: error.statusCode,
                message: error.message,
                success: false,
            });
        }
        next(error);
    }
}

