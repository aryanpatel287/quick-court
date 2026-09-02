import { body, param, query, validationResult } from 'express-validator';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * Standard validation result processor.
 */
export function validateRequest(req, res, next) {
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

export const createBookingValidator = [
    body('courtId').isUUID().withMessage('Valid court UUID is required'),
    body('bookingDate')
        .trim()
        .notEmpty()
        .withMessage('bookingDate is required (e.g. DD-MM-YYYY, DDMMYYYY, or YYYY-MM-DD)'),
    body('startTime')
        .trim()
        .notEmpty()
        .withMessage('startTime is required (e.g. HH:mm or HH:mm:ss)'),
    body('endTime').trim().notEmpty().withMessage('endTime is required (e.g. HH:mm or HH:mm:ss)'),
    body('facilityId').optional().isUUID().withMessage('facilityId must be a valid UUID'),
    validateRequest,
];

export const getBookingByIdValidator = [
    param('bookingId').isUUID().withMessage('Valid booking UUID is required'),
    validateRequest,
];

export const cancelBookingValidator = [
    param('bookingId').isUUID().withMessage('Valid booking UUID is required'),
    body('cancellationReason')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Cancellation reason must be at most 500 characters'),
    validateRequest,
];

export const userBookingsQueryValidator = [
    query('status')
        .optional()
        .isIn(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'confirmed', 'cancelled', 'completed'])
        .withMessage('Status must be CONFIRMED, CANCELLED, or COMPLETED'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    validateRequest,
];

export const ownerBookingsQueryValidator = [
    query('status')
        .optional()
        .isIn(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'confirmed', 'cancelled', 'completed'])
        .withMessage('Status must be CONFIRMED, CANCELLED, or COMPLETED'),
    query('courtId').optional().isUUID().withMessage('Invalid court UUID'),
    query('facilityId').optional().isUUID().withMessage('Invalid facility UUID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    validateRequest,
];
