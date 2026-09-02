import { Router } from 'express';
import * as venueController from '../controllers/venue.controller.js';
import {
    listVenuesValidator,
    venueIdParamValidator,
    availabilityValidator,
} from '../validators/venue.validator.js';

import { protect, restrictTo } from '../../auth/middleware/auth.middleware.js';
import * as reviewController from '../../review/controllers/review.controller.js';
import {
    listReviewsValidator,
    createReviewValidator,
} from '../../review/validators/review.validator.js';

const router = Router();

// Public routes for venue discovery
router.get('/', listVenuesValidator, venueController.listVenues);
router.get('/:venueId/courts', venueIdParamValidator, venueController.getVenueCourts);
router.get('/:venueId/availability', availabilityValidator, venueController.getVenueAvailability);
router.get('/:venueId/reviews', listReviewsValidator, reviewController.getVenueReviews);
router.post(
    '/:venueId/reviews',
    protect,
    restrictTo('USER'),
    createReviewValidator,
    reviewController.createReview,
);
router.get('/:venueId', venueIdParamValidator, venueController.getVenueById);

export default router;
