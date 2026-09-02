import { getPaymentByBookingId, updatePaymentByBookingId } from '../../../dao/payment.dao.js';
import { getBookingByIdWithDetails } from '../../../dao/booking.dao.js';
import { generateTransactionReference } from '../../../utils/booking.utils.js';

export class PaymentServiceError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'PaymentServiceError';
        this.statusCode = statusCode;
    }
}

/**
 * Simulates payment processing for a booking (SUCCESS or FAILED).
 *
 * @param {object} params
 * @param {string} params.bookingId
 * @param {string} params.status - 'SUCCESS' | 'FAILED' (or lowercase)
 * @param {object} params.user - Authenticated user
 * @returns {Promise<object>}
 */
export async function simulatePaymentProcessing({ bookingId, status, user }) {
    if (!bookingId) {
        throw new PaymentServiceError('Booking ID is required', 400);
    }

    const bookingWithDetails = await getBookingByIdWithDetails(bookingId);
    if (!bookingWithDetails || !bookingWithDetails.booking) {
        throw new PaymentServiceError('Booking not found', 404);
    }

    const { booking, facility } = bookingWithDetails;

    // Check authorization
    const userRole = (user.role || '').toUpperCase();
    const isBookingOwner = booking.userId === user.id;
    const isFacilityOwner = facility && facility.ownerId === user.id;
    const isAdmin = userRole === 'ADMIN';

    if (!isBookingOwner && !isFacilityOwner && !isAdmin) {
        throw new PaymentServiceError(
            'You do not have permission to process payment for this booking',
            403,
        );
    }

    const paymentRecord = await getPaymentByBookingId(bookingId);
    if (!paymentRecord) {
        throw new PaymentServiceError('Payment record not found for this booking', 404);
    }

    const normalizedStatus = String(status).toUpperCase();
    if (!['SUCCESS', 'FAILED'].includes(normalizedStatus)) {
        throw new PaymentServiceError('Invalid payment status. Must be SUCCESS or FAILED', 400);
    }

    const updatePayload = {
        status: normalizedStatus,
        updatedAt: new Date(),
    };

    if (normalizedStatus === 'SUCCESS') {
        const transactionRef = generateTransactionReference();
        updatePayload.paymentId = transactionRef;
        updatePayload.paidAt = new Date();
    } else {
        updatePayload.paidAt = null;
    }

    const updatedPayment = await updatePaymentByBookingId(bookingId, updatePayload);
    return updatedPayment;
}

/**
 * Retrieves payment details associated with a booking.
 *
 * @param {string} bookingId
 * @param {object} user - Authenticated user
 * @returns {Promise<object>}
 */
export async function getBookingPaymentDetails(bookingId, user) {
    if (!bookingId) {
        throw new PaymentServiceError('Booking ID is required', 400);
    }

    const bookingWithDetails = await getBookingByIdWithDetails(bookingId);
    if (!bookingWithDetails || !bookingWithDetails.booking) {
        throw new PaymentServiceError('Booking not found', 404);
    }

    const { booking, facility } = bookingWithDetails;

    // Authorization
    const userRole = (user.role || '').toUpperCase();
    const isBookingOwner = booking.userId === user.id;
    const isFacilityOwner = facility && facility.ownerId === user.id;
    const isAdmin = userRole === 'ADMIN';

    if (!isBookingOwner && !isFacilityOwner && !isAdmin) {
        throw new PaymentServiceError('You do not have permission to view this payment', 403);
    }

    const payment = await getPaymentByBookingId(bookingId);
    if (!payment) {
        throw new PaymentServiceError('Payment not found for this booking', 404);
    }

    return payment;
}
