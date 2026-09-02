import { body, param, query, validationResult } from 'express-validator';
import { sendResponse } from '../../../utils/response.utlis.js';

function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendResponse({
            res,
            statusCode: 400,
            message: 'Validation failed',
            success: false,
            errors: errors.array(),
        });
    }
    next();
}

export const listReviewsValidator = [
    param('venueId').isUUID().withMessage('Valid venue ID (UUID) is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('limit must be between 1 and 50'),
    query('sortBy')
        .optional()
        .isIn(['newest', 'highest', 'lowest'])
        .withMessage('sortBy must be one of: newest, highest, lowest'),
    validateRequest,
];

export const createReviewValidator = [
    param('venueId').isUUID().withMessage('Valid venue ID (UUID) is required'),
    body('bookingId')
        .notEmpty()
        .withMessage('bookingId is required')
        .isUUID()
        .withMessage('bookingId must be a valid UUID'),
    body('rating')
        .notEmpty()
        .withMessage('rating is required')
        .isInt({ min: 1, max: 5 })
        .withMessage('rating must be an integer between 1 and 5'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('comment cannot exceed 1000 characters'),
    validateRequest,
];

export const updateReviewValidator = [
    param('reviewId').isUUID().withMessage('Valid review ID (UUID) is required'),
    body('rating')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('rating must be an integer between 1 and 5'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('comment cannot exceed 1000 characters'),
    body().custom((val, { req }) => {
        if (req.body.rating === undefined && req.body.comment === undefined) {
            throw new Error('At least one of rating or comment must be provided for update');
        }
        return true;
    }),
    validateRequest,
];

export const reviewIdParamValidator = [
    param('reviewId').isUUID().withMessage('Valid review ID (UUID) is required'),
    validateRequest,
];
