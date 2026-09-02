import {
    validateBookingPrerequisites,
    BookingValidationError,
} from '../services/booking-validation.service.js';
import { calculateBookingPrice } from '../services/booking-pricing.service.js';
import { validateAndProcessCancellation } from '../services/booking-status.service.js';
import {
    createBookingTransaction,
    getBookingByIdWithDetails,
    getUserBookings,
} from '../../../dao/booking.dao.js';
import { generateBookingReference } from '../../../utils/booking.utils.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * Creates a new booking with initial payment record in a single transaction.
 * POST /api/bookings
 */
export async function createBooking(req, res, next) {
    try {
        const { facilityId, courtId, bookingDate, startTime, endTime } = req.body;

        // 1. Validate all business constraints & collision checks
        const { court, startDateTime, endDateTime } = await validateBookingPrerequisites({
            facilityId,
            courtId,
            bookingDate,
            startTime,
            endTime,
        });

        // 2. Compute duration and price snapshot
        const pricing = calculateBookingPrice(court, startDateTime, endDateTime);

        // 3. Generate human-readable booking reference
        const bookingReference = generateBookingReference(startDateTime);

        // 4. Prepare records for multi-table atomic transaction
        const bookingData = {
            bookingReference,
            userId: req.user.id,
            courtId: court.id,
            startTime: startDateTime,
            endTime: endDateTime,
            durationMinutes: pricing.durationMinutes,
            priceAmount: pricing.priceAmount,
            priceCurrency: pricing.priceCurrency,
            totalAmount: pricing.totalAmount,
            totalCurrency: pricing.totalCurrency,
            status: 'CONFIRMED',
        };

        const paymentData = {
            amount: pricing.totalAmount,
            currency: pricing.totalCurrency,
            status: 'PENDING',
        };

        const statusHistoryData = {
            changedBy: req.user.id,
            reason: 'Booking confirmed via booking engine',
        };

        // 5. Execute transaction
        const result = await createBookingTransaction({
            bookingData,
            paymentData,
            statusHistoryData,
        });

        return sendResponse({
            res,
            statusCode: 201,
            message: 'Booking created successfully',
            success: true,
            data: {
                booking: result.booking,
                payment: result.payment,
            },
        });
    } catch (error) {
        if (error instanceof BookingValidationError) {
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

/**
 * Retrieves booking details by ID with joined court, facility, and payment.
 * GET /api/bookings/:bookingId
 */
export async function getBookingById(req, res, next) {
    try {
        const { bookingId } = req.params;
        const details = await getBookingByIdWithDetails(bookingId);

        if (!details || !details.booking) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Booking not found',
                success: false,
            });
        }

        const userRole = (req.user.role || '').toUpperCase();
        const isOwnerOfBooking = details.booking.userId === req.user.id;
        const isOwnerOfFacility = details.facility && details.facility.ownerId === req.user.id;
        const isAdmin = userRole === 'ADMIN';

        if (!isOwnerOfBooking && !isOwnerOfFacility && !isAdmin) {
            return sendResponse({
                res,
                statusCode: 403,
                message: 'You do not have permission to access this booking',
                success: false,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Booking details retrieved successfully',
            success: true,
            data: details,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Cancels a future confirmed booking.
 * PATCH /api/bookings/:bookingId/cancel
 */
export async function cancelBooking(req, res, next) {
    try {
        const { bookingId } = req.params;
        const { cancellationReason } = req.body;

        const updatedBooking = await validateAndProcessCancellation(
            bookingId,
            req.user,
            cancellationReason,
        );

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Booking cancelled successfully',
            success: true,
            data: {
                booking: updatedBooking,
            },
        });
    } catch (error) {
        if (error instanceof BookingValidationError) {
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

/**
 * Retrieves authenticated user's bookings with pagination and status filters.
 * GET /api/users/me/bookings
 */
export async function getMyBookings(req, res, next) {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const result = await getUserBookings(req.user.id, {
            status,
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 10,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'User bookings retrieved successfully',
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

