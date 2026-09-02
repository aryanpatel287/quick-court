import { body, param, query, validationResult } from 'express-validator';

export function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed.',
            success: false,
            errors: errors.array(),
        });
    }
    next();
}

export const createCourtValidator = [
    param('facilityId').isUUID().withMessage('Valid facility ID is required.'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Court name is required.')
        .isLength({ min: 2, max: 50 })
        .withMessage('Court name must be between 2 and 50 characters.'),
    body('sportId')
        .notEmpty()
        .withMessage('Sport ID is required.')
        .isUUID()
        .withMessage('Valid sport UUID is required.'),
    body('priceAmount')
        .notEmpty()
        .withMessage('Price per hour is required.')
        .isFloat({ min: 0.01 })
        .withMessage('Price per hour must be greater than 0.'),
    body('priceCurrency').optional().isIn(['INR']).withMessage('Currency must be INR.'),
    body('operatingHours')
        .optional()
        .isArray()
        .withMessage('Operating hours must be an array of daily schedules.'),
    validateRequest,
];

export const updateCourtValidator = [
    param('courtId').isUUID().withMessage('Valid court ID is required.'),
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Court name cannot be empty.')
        .isLength({ min: 2, max: 50 })
        .withMessage('Court name must be between 2 and 50 characters.'),
    body('sportId').optional().isUUID().withMessage('Sport ID must be a valid UUID.'),
    body('priceAmount')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Price per hour must be greater than 0.'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),
    validateRequest,
];

export const courtIdParamValidator = [
    param('courtId').isUUID().withMessage('Valid court ID is required in URL parameter.'),
    validateRequest,
];

export const facilityCourtsParamValidator = [
    param('facilityId').isUUID().withMessage('Valid facility ID is required in URL parameter.'),
    validateRequest,
];
