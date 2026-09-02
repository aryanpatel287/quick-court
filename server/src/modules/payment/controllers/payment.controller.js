import {
    simulatePaymentProcessing,
    getBookingPaymentDetails,
    PaymentServiceError,
} from '../services/payment.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * Handles payment simulation (SUCCESS / FAILED).
 * POST /api/payments/simulate
 */
export async function simulatePayment(req, res, next) {
    try {
        const { bookingId, status } = req.body;
        const updatedPayment = await simulatePaymentProcessing({
            bookingId,
            status,
            user: req.user,
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: `Payment simulation recorded as ${updatedPayment.status}`,
            success: true,
            data: {
                payment: updatedPayment,
            },
        });
    } catch (error) {
        if (error instanceof PaymentServiceError) {
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
 * Retrieves payment record by booking ID.
 * GET /api/payments/:bookingId
 */
export async function getPaymentByBooking(req, res, next) {
    try {
        const { bookingId } = req.params;
        const payment = await getBookingPaymentDetails(bookingId, req.user);

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Payment details retrieved successfully',
            success: true,
            data: {
                payment,
            },
        });
    } catch (error) {
        if (error instanceof PaymentServiceError) {
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
