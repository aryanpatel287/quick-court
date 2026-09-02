import { Router } from 'express';
import { protect, restrictTo } from '../../auth/middleware/auth.middleware.js';
import * as ownerBookingController from '../controllers/owner-booking.controller.js';
import * as ownerDashboardController from '../controllers/owner-dashboard.controller.js';
import {
    ownerBookingsQueryValidator,
    calendarQueryValidator,
    cancelOwnerBookingValidator,
    dashboardQueryValidator,
    trendQueryValidator,
} from '../validators/owner.validator.js';

const router = Router();

// All owner routes require FACILITY_OWNER role
router.use(protect, restrictTo('FACILITY_OWNER'));

// Owner Booking Routes
router.get('/bookings', ownerBookingsQueryValidator, ownerBookingController.getOwnerBookings);
router.get(
    '/bookings/upcoming',
    ownerBookingsQueryValidator,
    ownerBookingController.getOwnerUpcomingBookings,
);
router.get(
    '/bookings/past',
    ownerBookingsQueryValidator,
    ownerBookingController.getOwnerPastBookings,
);
router.get(
    '/bookings/calendar',
    calendarQueryValidator,
    ownerBookingController.getOwnerCalendarBookings,
);
router.patch(
    '/bookings/:bookingId/cancel',
    cancelOwnerBookingValidator,
    ownerBookingController.cancelOwnerBooking,
);

// Owner Dashboard Analytics Routes
router.get(
    '/dashboard/summary',
    dashboardQueryValidator,
    ownerDashboardController.getDashboardSummary,
);
router.get(
    '/dashboard/bookings-trend',
    trendQueryValidator,
    ownerDashboardController.getBookingsTrend,
);
router.get('/dashboard/earnings', dashboardQueryValidator, ownerDashboardController.getEarnings);
router.get('/dashboard/peak-hours', dashboardQueryValidator, ownerDashboardController.getPeakHours);

export default router;
