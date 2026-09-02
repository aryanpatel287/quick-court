import { Router } from 'express';
import { protect, restrictTo } from '../../auth/middleware/auth.middleware.js';
import * as reviewController from '../controllers/review.controller.js';
import {
    listReviewsValidator,
    createReviewValidator,
    updateReviewValidator,
    reviewIdParamValidator,
} from '../validators/review.validator.js';

const router = Router();

// Public review listing for a venue
router.get('/venues/:venueId/reviews', listReviewsValidator, reviewController.getVenueReviews);

// Create review (requires USER role)
router.post(
    '/venues/:venueId/reviews',
    protect,
    restrictTo('USER'),
    createReviewValidator,
    reviewController.createReview,
);

// Update review (requires authenticated author)
router.patch('/reviews/:reviewId', protect, updateReviewValidator, reviewController.updateReview);

// Delete review (requires authenticated author or ADMIN)
router.delete('/reviews/:reviewId', protect, reviewIdParamValidator, reviewController.deleteReview);

export default router;
