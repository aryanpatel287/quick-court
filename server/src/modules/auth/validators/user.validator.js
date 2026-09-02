import { body, validationResult } from 'express-validator';
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

export const updateProfileValidator = [
    body('firstName').optional().trim().notEmpty().withMessage('First Name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last Name cannot be empty'),
    body('email').optional().trim().isEmail().withMessage('A valid email is required'),
    body('profileImage')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Profile image path cannot be empty'),
    validateRequest,
];

export const adminUpdateRoleValidator = [
    body('role')
        .trim()
        .notEmpty()
        .withMessage('Role is required')
        .isIn(['user', 'admin'])
        .withMessage('Role must be either user or admin'),
    validateRequest,
];

export const deleteAccountValidator = [
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
];
