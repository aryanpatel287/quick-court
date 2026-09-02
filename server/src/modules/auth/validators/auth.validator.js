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

export const registerValidator = [
    body('firstName').trim().notEmpty().withMessage('First Name is required'),
    body('lastName').trim().notEmpty().withMessage('Last Name is required'),
    body('email').trim().isEmail().withMessage('A valid email is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    validateRequest,
];

export const loginValidator = [
    body('email').trim().isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
];

export const changePasswordValidator = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long'),
    validateRequest,
];

export const forgotPasswordValidator = [
    body('email').trim().notEmpty().isEmail().withMessage('Valid email is required.'),
    validateRequest,
];

export const sendVerificationOtpValidator = [
    body('email').trim().notEmpty().isEmail().withMessage('Valid email is required.'),
    validateRequest,
];

export const resetPasswordValidator = [
    body('email').trim().notEmpty().isEmail().withMessage('Valid email is required.'),
    body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required.')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 characters long.'),
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required.')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long.')
        .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
        .withMessage(
            'Password must include at least one uppercase letter, one number, and one special character.',
        ),
    body('confirmPassword')
        .trim()
        .notEmpty()
        .withMessage('Confirm password is required.')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match.'),
    validateRequest,
];

export const recoverAccountValidator = [
    body('email').trim().notEmpty().isEmail().withMessage('Valid email is required.'),
    validateRequest,
];

export const verifyRecoverAccountValidator = [
    body('email').trim().notEmpty().isEmail().withMessage('Valid email is required.'),
    body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required.')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 characters long.'),
    validateRequest,
];

export const verifyForgotPasswordOtpValidator = [
    body('email').trim().notEmpty().isEmail().withMessage('Valid email is required.'),
    body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required.')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 characters long.'),
    validateRequest,
];
