import { body, param, validationResult } from 'express-validator';
import { sendResponse } from '../../../utils/response.utlis.js';

function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendResponse({
            res,
            statusCode: 400,
            message: `Validation failed: ${errors
                .array()
                .map((e) => e.msg)
                .join(', ')}`,
            success: false,
            errors: errors.array(),
        });
    }
    next();
}

export const simulatePaymentValidator = [
    body('bookingId').isUUID().withMessage('Valid booking UUID is required'),
    body('status')
        .trim()
        .notEmpty()
        .isIn(['SUCCESS', 'FAILED', 'success', 'failed'])
        .withMessage('Status must be SUCCESS or FAILED'),
    validateRequest,
];

export const getPaymentByBookingIdValidator = [
    param('bookingId').isUUID().withMessage('Valid booking UUID is required'),
    validateRequest,
];
