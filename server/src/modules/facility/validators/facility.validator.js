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

const venueTypes = ['INDOOR', 'OUTDOOR', 'SPORTS_COMPLEX', 'STADIUM', 'OTHER'];

export const createFacilityValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Facility name is required.')
        .isLength({ min: 3, max: 100 })
        .withMessage('Facility name must be between 3 and 100 characters.'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters.'),
    body('addressLine').trim().notEmpty().withMessage('Address line is required.'),
    body('city').trim().notEmpty().withMessage('City is required.'),
    body('state').trim().notEmpty().withMessage('State is required.'),
    body('postalCode').optional().trim(),
    body('latitude')
        .optional({ nullable: true })
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90.'),
    body('longitude')
        .optional({ nullable: true })
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180.'),
    body('venueType')
        .notEmpty()
        .withMessage('Venue type is required.')
        .isIn(venueTypes)
        .withMessage(`Venue type must be one of: ${venueTypes.join(', ')}`),
    body('sportIds').isArray({ min: 1 }).withMessage('At least one sport must be selected.'),
    body('sportIds.*').isUUID().withMessage('Each sport ID must be a valid UUID.'),
    body('amenityIds').optional().isArray().withMessage('Amenity IDs must be an array.'),
    body('amenityIds.*').optional().isUUID().withMessage('Each amenity ID must be a valid UUID.'),
    validateRequest,
];

export const updateFacilityValidator = [
    param('facilityId').isUUID().withMessage('Valid facility ID is required.'),
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Facility name cannot be empty.')
        .isLength({ min: 3, max: 100 })
        .withMessage('Facility name must be between 3 and 100 characters.'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters.'),
    body('addressLine').optional().trim().notEmpty().withMessage('Address line cannot be empty.'),
    body('city').optional().trim().notEmpty().withMessage('City cannot be empty.'),
    body('state').optional().trim().notEmpty().withMessage('State cannot be empty.'),
    body('postalCode').optional().trim(),
    body('latitude')
        .optional({ nullable: true })
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90.'),
    body('longitude')
        .optional({ nullable: true })
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180.'),
    body('venueType')
        .optional()
        .isIn(venueTypes)
        .withMessage(`Venue type must be one of: ${venueTypes.join(', ')}`),
    body('sportIds').optional().isArray().withMessage('Sport IDs must be an array.'),
    body('sportIds.*').optional().isUUID().withMessage('Each sport ID must be a valid UUID.'),
    body('amenityIds').optional().isArray().withMessage('Amenity IDs must be an array.'),
    body('amenityIds.*').optional().isUUID().withMessage('Each amenity ID must be a valid UUID.'),
    validateRequest,
];

export const facilityIdParamValidator = [
    param('facilityId').isUUID().withMessage('Valid facility ID is required in URL parameter.'),
    validateRequest,
];

export const facilityPhotoParamValidator = [
    param('facilityId').isUUID().withMessage('Valid facility ID is required in URL parameter.'),
    param('photoId').isUUID().withMessage('Valid photo ID is required in URL parameter.'),
    validateRequest,
];
