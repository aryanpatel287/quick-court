import { query, param, validationResult } from 'express-validator';
import { sendResponse } from '../../../utils/response.utlis.js';
import { parseDDMMYYYY } from '../../../utils/date.utils.js';

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

export const listVenuesValidator = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    query('venueType')
        .optional()
        .custom((val) => {
            const allowed = ['INDOOR', 'OUTDOOR', 'SPORTS_COMPLEX', 'STADIUM', 'OTHER'];
            if (!allowed.includes(val)) {
                throw new Error(`Venue type must be one of: ${allowed.join(', ')}`);
            }
            return true;
        }),
    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('minPrice must be a non-negative number'),
    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('maxPrice must be a non-negative number'),
    query('minRating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('minRating must be between 0 and 5'),
    query('sortBy')
        .optional()
        .isIn(['price_asc', 'price_desc', 'rating_desc', 'newest'])
        .withMessage('sortBy must be one of: price_asc, price_desc, rating_desc, newest'),
    validateRequest,
];

export const venueIdParamValidator = [
    param('venueId').isUUID().withMessage('Valid venue ID (UUID) is required'),
    validateRequest,
];

export const availabilityValidator = [
    param('venueId').isUUID().withMessage('Valid venue ID (UUID) is required'),
    query('date')
        .trim()
        .notEmpty()
        .withMessage('Date query parameter is required (format: DD-MM-YYYY or DDMMYYYY)')
        .custom((val) => {
            const parsed = parseDDMMYYYY(val);
            if (!parsed) {
                throw new Error('Invalid date format. Use DD-MM-YYYY or DDMMYYYY.');
            }
            return true;
        }),
    query('courtId').optional().isUUID().withMessage('courtId must be a valid UUID'),
    query('slotDuration')
        .optional()
        .isInt({ min: 15, max: 240 })
        .withMessage('slotDuration must be between 15 and 240 minutes'),
    validateRequest,
];
