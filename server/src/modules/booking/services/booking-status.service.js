import { getBookingByIdWithDetails, updateBookingStatus } from '../../../dao/booking.dao.js';
import { BookingValidationError } from './booking-validation.service.js';

/**
 * Validates cancellation rules, permissions, and transitions booking status to CANCELLED.
 *
 * @param {string} bookingId
 * @param {object} user - Authenticated user performing cancellation
 * @param {string} [cancellationReason] - Optional reason for cancellation
 * @returns {Promise<object>}
 */
export async function validateAndProcessCancellation(bookingId, user, cancellationReason) {
    if (!bookingId) {
        throw new BookingValidationError('Booking ID is required', 400);
    }

    const bookingWithDetails = await getBookingByIdWithDetails(bookingId);
    if (!bookingWithDetails || !bookingWithDetails.booking) {
        throw new BookingValidationError('Booking not found', 404);
    }

    const { booking, facility } = bookingWithDetails;

    // RBAC & Ownership check
    const userRole = (user.role || '').toUpperCase();
    const isOwnerOfBooking = booking.userId === user.id;
    const isOwnerOfFacility = facility && facility.ownerId === user.id;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwnerOfBooking && !isOwnerOfFacility && !isAdmin) {
        throw new BookingValidationError(
            'You do not have permission to access/cancel this booking',
            403,
        );
    }

    // State machine check
    if (booking.status === 'CANCELLED') {
        throw new BookingValidationError('Booking is already cancelled', 409);
    }

    if (booking.status === 'COMPLETED') {
        throw new BookingValidationError('Completed bookings cannot be cancelled', 400);
    }

    if (booking.status !== 'CONFIRMED') {
        throw new BookingValidationError('Only confirmed bookings can be cancelled', 400);
    }

    // Timing check: Must be in future
    const now = new Date();
    if (new Date(booking.startTime).getTime() <= now.getTime()) {
        throw new BookingValidationError(
            'Cannot cancel a booking that has already started or passed',
            400,
        );
    }

    const reason =
        cancellationReason ||
        (isOwnerOfBooking ? 'Cancelled by customer' : 'Cancelled by venue host');

    const updatedBooking = await updateBookingStatus(bookingId, 'CANCELLED', {
        cancelledAt: new Date(),
        cancellationReason: reason,
        changedBy: user.id,
    });

    return updatedBooking;
}
