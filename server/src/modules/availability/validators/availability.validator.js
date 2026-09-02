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

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const setAvailabilityValidator = [
    param('courtId').isUUID().withMessage('Valid court ID is required.'),
    body('schedules')
        .isArray({ min: 1, max: 7 })
        .withMessage('Schedules must be an array of 1 to 7 daily configurations.'),
    body('schedules.*.dayOfWeek')
        .isInt({ min: 0, max: 6 })
        .withMessage('Day of week must be an integer between 0 (Sunday) and 6 (Saturday).'),
    body('schedules.*.isClosed').isBoolean().withMessage('isClosed must be a boolean value.'),
    body('schedules.*').custom((schedule) => {
        if (!schedule.isClosed) {
            if (!schedule.startTime || !timeRegex.test(schedule.startTime)) {
                throw new Error(
                    `Valid startTime (HH:mm or HH:mm:ss) required for day ${schedule.dayOfWeek} when open.`,
                );
            }
            if (!schedule.endTime || !timeRegex.test(schedule.endTime)) {
                throw new Error(
                    `Valid endTime (HH:mm or HH:mm:ss) required for day ${schedule.dayOfWeek} when open.`,
                );
            }
            if (schedule.startTime >= schedule.endTime) {
                throw new Error(`startTime must be before endTime for day ${schedule.dayOfWeek}.`);
            }
        }
        return true;
    }),
    validateRequest,
];

export const updateDayAvailabilityValidator = [
    param('courtId').isUUID().withMessage('Valid court ID is required.'),
    param('dayOfWeek')
        .isInt({ min: 0, max: 6 })
        .withMessage('Day of week must be between 0 and 6.'),
    body('isClosed').optional().isBoolean().withMessage('isClosed must be a boolean.'),
    body('startTime')
        .optional({ nullable: true })
        .matches(timeRegex)
        .withMessage('startTime must be in HH:mm or HH:mm:ss format.'),
    body('endTime')
        .optional({ nullable: true })
        .matches(timeRegex)
        .withMessage('endTime must be in HH:mm or HH:mm:ss format.'),
    body().custom((bodyData) => {
        if (bodyData.isClosed === false) {
            if (bodyData.startTime && bodyData.endTime && bodyData.startTime >= bodyData.endTime) {
                throw new Error('startTime must be before endTime.');
            }
        }
        return true;
    }),
    validateRequest,
];

export const createMaintenanceBlockValidator = [
    param('courtId').isUUID().withMessage('Valid court ID is required.'),
    body('startTime')
        .notEmpty()
        .withMessage('Start time is required.')
        .isISO8601()
        .withMessage('Start time must be a valid ISO 8601 timestamp string.'),
    body('endTime')
        .notEmpty()
        .withMessage('End time is required.')
        .isISO8601()
        .withMessage('End time must be a valid ISO 8601 timestamp string.'),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Reason cannot exceed 255 characters.'),
    body().custom((bodyData) => {
        const start = new Date(bodyData.startTime);
        const end = new Date(bodyData.endTime);
        const now = new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid timestamp provided.');
        }

        if (end <= start) {
            throw new Error('End time must be strictly after start time.');
        }

        if (start < now) {
            throw new Error('Maintenance block start time must be in the future.');
        }

        return true;
    }),
    validateRequest,
];

export const blockIdParamValidator = [
    param('blockId')
        .isUUID()
        .withMessage('Valid maintenance block ID is required in URL parameter.'),
    validateRequest,
];

export const courtIdParamValidator = [
    param('courtId').isUUID().withMessage('Valid court ID is required in URL parameter.'),
    validateRequest,
];
