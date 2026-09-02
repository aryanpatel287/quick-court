import { query, validationResult } from 'express-validator';
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

export const homeQueryValidator = [
    query('city').optional().trim().isString().withMessage('City must be a string'),
    validateRequest,
];

export const popularVenuesValidator = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Limit must be an integer between 1 and 20'),
    query('city').optional().trim().isString().withMessage('City must be a string'),
    validateRequest,
];

export const popularSportsValidator = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be an integer between 1 and 50'),
    validateRequest,
];
