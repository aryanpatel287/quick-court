import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * ============================================================
 * USER ROLES
 * ============================================================
 *
 * USER:
 * - Discover venues
 * - Book courts
 * - Cancel own future bookings
 * - Review completed bookings
 *
 * FACILITY_OWNER:
 * - Create/manage facilities
 * - Manage courts
 * - Configure operating hours
 * - Add maintenance blocks
 * - View bookings and earnings
 *
 * ADMIN:
 * - Approve/reject facilities
 * - Manage users
 * - View platform analytics
 */
export const roleEnum = pgEnum('role_enum', ['USER', 'FACILITY_OWNER', 'ADMIN']);

/**
 * ============================================================
 * FACILITY STATUS
 * ============================================================
 *
 * PENDING:
 *     Newly registered / waiting for admin review.
 *
 * APPROVED:
 *     Publicly visible and bookable.
 *
 * REJECTED:
 *     Rejected by admin.
 *
 * Recommended lifecycle:
 *
 * PENDING → APPROVED
 * PENDING → REJECTED
 * REJECTED → PENDING
 */
export const facilityStatusEnum = pgEnum('facility_status_enum', [
    'PENDING',
    'APPROVED',
    'REJECTED',
]);

/**
 * ============================================================
 * BOOKING STATUS
 * ============================================================
 *
 * CONFIRMED:
 *     Payment successful and court reserved.
 *
 * CANCELLED:
 *     Booking was cancelled before its start time.
 *
 * COMPLETED:
 *     Booking time has passed / booking was completed.
 */
export const bookingStatusEnum = pgEnum('booking_status_enum', [
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED',
]);

/**
 * ============================================================
 * PAYMENT STATUS
 * ============================================================
 */
export const paymentStatusEnum = pgEnum('payment_status_enum', ['PENDING', 'SUCCESS', 'FAILED']);

/**
 * ============================================================
 * VENUE TYPE
 * ============================================================
 */
export const venueTypeEnum = pgEnum('venue_type_enum', [
    'INDOOR',
    'OUTDOOR',
    'SPORTS_COMPLEX',
    'STADIUM',
    'OTHER',
]);

/**
 * ============================================================
 * CURRENCY
 * ============================================================
 *
 * QuickCourt currently operates only in India.
 *
 * Keeping currency as an enum instead of arbitrary TEXT gives
 * us database-level protection against values such as:
 *
 * "Rupee"
 * "Rs"
 * "₹"
 * "INR "
 *
 * Future currencies can be added through a migration.
 */
export const currencyEnum = pgEnum('currency_enum', ['INR']);
