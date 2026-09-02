import { query, validationResult } from 'express-validator';
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

export const ownerBookingsQueryValidator = [
    query('facilityId').optional().isUUID().withMessage('facilityId must be a valid UUID'),
    query('courtId').optional().isUUID().withMessage('courtId must be a valid UUID'),
    query('status')
        .optional()
        .custom((val) => {
            const allowed = ['CONFIRMED', 'CANCELLED', 'COMPLETED'];
            if (!allowed.includes(val)) {
                throw new Error(`status must be one of: ${allowed.join(', ')}`);
            }
            return true;
        }),
    query('startDate')
        .optional()
        .custom((val) => {
            const parsed = parseDDMMYYYY(val);
            if (!parsed) throw new Error('startDate must be in format DD-MM-YYYY or DDMMYYYY');
            return true;
        }),
    query('endDate')
        .optional()
        .custom((val) => {
            const parsed = parseDDMMYYYY(val);
            if (!parsed) throw new Error('endDate must be in format DD-MM-YYYY or DDMMYYYY');
            return true;
        }),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit must be between 1 and 100'),
    validateRequest,
];

export const calendarQueryValidator = [
    query('facilityId').optional().isUUID().withMessage('facilityId must be a valid UUID'),
    query('month')
        .optional()
        .isInt({ min: 1, max: 12 })
        .withMessage('month must be between 1 and 12'),
    query('year')
        .optional()
        .isInt({ min: 2000, max: 2100 })
        .withMessage('year must be a valid 4-digit year'),
    validateRequest,
];

export const dashboardQueryValidator = [
    query('facilityId').optional().isUUID().withMessage('facilityId must be a valid UUID'),
    validateRequest,
];

export const trendQueryValidator = [
    query('facilityId').optional().isUUID().withMessage('facilityId must be a valid UUID'),
    query('period')
        .optional()
        .isIn(['daily', 'weekly', 'monthly'])
        .withMessage('period must be one of: daily, weekly, monthly'),
    query('startDate')
        .optional()
        .custom((val) => {
            const parsed = parseDDMMYYYY(val);
            if (!parsed) throw new Error('startDate must be in format DD-MM-YYYY or DDMMYYYY');
            return true;
        }),
    query('endDate')
        .optional()
        .custom((val) => {
            const parsed = parseDDMMYYYY(val);
            if (!parsed) throw new Error('endDate must be in format DD-MM-YYYY or DDMMYYYY');
            return true;
        }),
    validateRequest,
];
