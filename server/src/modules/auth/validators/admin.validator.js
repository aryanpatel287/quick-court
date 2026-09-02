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

export const facilityListValidator = [
    query('status')
        .optional()
        .trim()
        .isIn(['PENDING', 'APPROVED', 'REJECTED', 'pending', 'approved', 'rejected'])
        .withMessage('Status must be PENDING, APPROVED, or REJECTED'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('search').optional().trim(),
    validateRequest,
];

export const facilityIdValidator = [
    param('facilityId').trim().isUUID().withMessage('Invalid facility ID format. UUID required.'),
    validateRequest,
];

export const facilityApproveValidator = [
    param('facilityId').trim().isUUID().withMessage('Invalid facility ID format. UUID required.'),
    body('comment').optional().trim(),
    validateRequest,
];

export const facilityRejectValidator = [
    param('facilityId').trim().isUUID().withMessage('Invalid facility ID format. UUID required.'),
    body('reason').trim().notEmpty().withMessage('Rejection reason is required'),
    validateRequest,
];

export const userListValidator = [
    query('role')
        .optional()
        .trim()
        .isIn(['USER', 'FACILITY_OWNER', 'ADMIN', 'user', 'facility_owner', 'admin'])
        .withMessage('Role must be user, facility_owner, or admin'),
    query('status')
        .optional()
        .trim()
        .isIn(['active', 'banned', 'deleted', 'ACTIVE', 'BANNED', 'DELETED'])
        .withMessage('Status must be active, banned, or deleted'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('search').optional().trim(),
    validateRequest,
];

export const userIdValidator = [
    param('userId')
        .optional()
        .trim()
        .isUUID()
        .withMessage('Invalid user ID format. UUID required.'),
    param('id').optional().trim().isUUID().withMessage('Invalid user ID format. UUID required.'),
    validateRequest,
];

export const dashboardQueryValidator = [
    query('period')
        .optional()
        .trim()
        .isIn(['daily', 'weekly', 'monthly', 'DAILY', 'WEEKLY', 'MONTHLY'])
        .withMessage('Period must be daily, weekly, or monthly'),
    query('startDate')
        .optional()
        .trim()
        .isISO8601()
        .withMessage('startDate must be a valid ISO8601 date string'),
    query('endDate')
        .optional()
        .trim()
        .isISO8601()
        .withMessage('endDate must be a valid ISO8601 date string'),
    validateRequest,
];
