import { Router } from 'express';
import { protect, restrictTo } from '../../auth/middleware/auth.middleware.js';
import {
    getOwnerBookingsList,
    getOwnerUpcomingBookings,
    getOwnerPastBookings,
    getOwnerCalendarBookings,
} from '../controllers/booking.controller.js';
import { ownerBookingsQueryValidator } from '../validators/booking.validator.js';

const router = Router();

// All owner booking endpoints require authentication and FACILITY_OWNER or ADMIN role
router.use(protect);
router.use(restrictTo('FACILITY_OWNER', 'ADMIN'));

router.get('/', ownerBookingsQueryValidator, getOwnerBookingsList);
router.get('/upcoming', getOwnerUpcomingBookings);
router.get('/past', getOwnerPastBookings);
router.get('/calendar', getOwnerCalendarBookings);

export default router;
