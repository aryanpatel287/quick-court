import { Router } from 'express';
import { protect } from '../../auth/middleware/auth.middleware.js';
import { simulatePayment, getPaymentByBooking } from '../controllers/payment.controller.js';
import {
    simulatePaymentValidator,
    getPaymentByBookingIdValidator,
} from '../validators/payment.validator.js';

const router = Router();

// Simulated payment routes require authentication
router.post('/simulate', protect, simulatePaymentValidator, simulatePayment);
router.get('/:bookingId', protect, getPaymentByBookingIdValidator, getPaymentByBooking);

export default router;
