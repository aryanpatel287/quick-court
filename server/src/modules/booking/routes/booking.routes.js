import { Router } from 'express';
import { protect } from '../../auth/middleware/auth.middleware.js';
import {
    createBooking,
    getBookingById,
    cancelBooking,
    getMyBookings,
} from '../controllers/booking.controller.js';
import {
    createBookingValidator,
    getBookingByIdValidator,
    cancelBookingValidator,
    userBookingsQueryValidator,
} from '../validators/booking.validator.js';

const router = Router();

// User bookings list (also accessible at /api/users/me/bookings when mounted or via /me)
router.get('/me', protect, userBookingsQueryValidator, getMyBookings);

// Booking creation, retrieval, and cancellation
router.post('/', protect, createBookingValidator, createBooking);
router.get('/:bookingId', protect, getBookingByIdValidator, getBookingById);
router.patch('/:bookingId/cancel', protect, cancelBookingValidator, cancelBooking);

export default router;
