import request from 'supertest';
import app from '../../app.js';
import { db } from '../../config/database.config.js';
import {
    facilities,
    sports,
    courts,
    courtOperatingHours,
    maintenanceBlocks,
    bookings,
} from '../../db/schema/schema.js';
import { eq } from 'drizzle-orm';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser } from '../helpers/auth-helper.js';
import { runBookingStatusCompletion } from '../../cron/bookingStatus.cron.js';

const docLogger = new FeatureApiDocLogger(
    '04_booking_engine.md',
    'Feature 04: Booking Engine & Simulated Payment API',
    'Covers court booking creation, collision detection, maintenance blocks, simulated payment lifecycle, user & owner queries, cancellations, and auto-completion.',
);

describe('04: Booking Engine & Payment API', () => {
    let customerUser;
    let customerCookie;
    let otherCustomerCookie;

    let ownerUser;
    let ownerCookie;

    let testSport;
    let testFacility;
    let testCourt;

    // Helper date string generator (tomorrow) in DD-MM-YYYY
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayStr = String(tomorrow.getDate()).padStart(2, '0');
    const monthStr = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const yearStr = String(tomorrow.getFullYear());
    const tomorrowDDMMYYYY = `${dayStr}-${monthStr}-${yearStr}`;

    let createdBookingId;

    beforeAll(async () => {
        // 1. Create customer and owner users
        const customerAuth = await createAndLoginTestUser({ role: 'USER' });
        customerUser = customerAuth.user;
        customerCookie = customerAuth.cookie;

        const otherCustomerAuth = await createAndLoginTestUser({ role: 'USER' });
        otherCustomerCookie = otherCustomerAuth.cookie;

        const ownerAuth = await createAndLoginTestUser({ role: 'FACILITY_OWNER' });
        ownerUser = ownerAuth.user;
        ownerCookie = ownerAuth.cookie;

        // 2. Insert test sport
        const [sport] = await db
            .insert(sports)
            .values({
                name: `Badminton_${Date.now()}`,
                slug: `badminton_${Date.now()}`,
            })
            .returning();
        testSport = sport;

        // 3. Insert test facility
        const [facility] = await db
            .insert(facilities)
            .values({
                ownerId: ownerUser.id,
                name: 'Apex Sports Arena',
                description: 'Premier sports complex',
                addressLine: '123 Stadium Road',
                city: 'Ahmedabad',
                state: 'Gujarat',
                postalCode: '380001',
                venueType: 'SPORTS_COMPLEX',
                status: 'APPROVED',
            })
            .returning();
        testFacility = facility;

        // 4. Insert test court
        const [court] = await db
            .insert(courts)
            .values({
                facilityId: testFacility.id,
                sportId: testSport.id,
                name: 'Court A (Synthetic)',
                priceAmount: '600.00',
                priceCurrency: 'INR',
                isActive: true,
            })
            .returning();
        testCourt = court;

        // 5. Insert operating hours for all 7 days (06:00 to 23:00)
        const hoursValues = [];
        for (let day = 0; day <= 6; day++) {
            hoursValues.push({
                courtId: testCourt.id,
                dayOfWeek: day,
                startTime: '06:00:00',
                endTime: '23:00:00',
                isClosed: false,
            });
        }
        await db.insert(courtOperatingHours).values(hoursValues);

        // 6. Insert maintenance block for tomorrow (14:00 to 16:00)
        const maintStart = new Date(tomorrow);
        maintStart.setHours(14, 0, 0, 0);
        const maintEnd = new Date(tomorrow);
        maintEnd.setHours(16, 0, 0, 0);

        await db.insert(maintenanceBlocks).values({
            courtId: testCourt.id,
            createdBy: ownerUser.id,
            startTime: maintStart,
            endTime: maintEnd,
            reason: 'Court repainting and surface repair',
        });
    });

    afterAll(() => {
        docLogger.save();
    });

    // -------------------------------------------------------------
    // POST /api/bookings (Creation & Validation)
    // -------------------------------------------------------------
    describe('POST /api/bookings', () => {
        it('should successfully create a new booking (201 Created)', async () => {
            const payload = {
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: tomorrowDDMMYYYY,
                startTime: '10:00',
                endTime: '11:30', // 1.5 hours @ 600/hr = 900.00
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Cookie', customerCookie)
                .send(payload);

            docLogger.record({
                scenario: 'Create Booking (Success)',
                method: 'POST',
                endpoint: '/api/bookings',
                requestBody: payload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Validates slot, calculates duration & pricing, and creates booking + payment.',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.booking).toBeDefined();
            expect(res.body.data.booking.bookingReference).toMatch(/^BK-\d{8}-[A-F0-9]{6}$/);
            expect(res.body.data.booking.durationMinutes).toBe(90);
            expect(res.body.data.booking.priceAmount).toBe('600.00');
            expect(res.body.data.booking.totalAmount).toBe('900.00');
            expect(res.body.data.booking.status).toBe('CONFIRMED');
            expect(res.body.data.payment).toBeDefined();
            expect(res.body.data.payment.status).toBe('PENDING');

            createdBookingId = res.body.data.booking.id;
        });

        it('should reject double-booking overlap with existing confirmed booking (409 Conflict)', async () => {
            const overlapPayload = {
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: tomorrowDDMMYYYY,
                startTime: '10:30',
                endTime: '12:00',
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Cookie', otherCustomerCookie)
                .send(overlapPayload);

            docLogger.record({
                scenario: 'Double-Booking Conflict Rejection',
                method: 'POST',
                endpoint: '/api/bookings',
                requestBody: overlapPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Rejects overlapping time slot with 409 Conflict.',
            });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('already booked');
        });

        it('should reject enclosing double-booking overlap (409 Conflict)', async () => {
            const enclosingPayload = {
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: tomorrowDDMMYYYY,
                startTime: '09:00',
                endTime: '12:00',
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Cookie', otherCustomerCookie)
                .send(enclosingPayload);

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('should allow adjacent back-to-back booking starting right when previous ends (201 Created)', async () => {
            const adjacentPayload = {
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: tomorrowDDMMYYYY,
                startTime: '11:30',
                endTime: '12:30', // 1 hour @ 600/hr = 600.00
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Cookie', otherCustomerCookie)
                .send(adjacentPayload);

            docLogger.record({
                scenario: 'Adjacent Back-to-Back Slot Booking (Success)',
                method: 'POST',
                endpoint: '/api/bookings',
                requestBody: adjacentPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Allows adjacent slots without false positive collisions.',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.booking.totalAmount).toBe('600.00');
        });

        it('should reject booking in the past (400 Bad Request)', async () => {
            const pastPayload = {
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: '01-01-2020',
                startTime: '10:00',
                endTime: '11:00',
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Cookie', customerCookie)
                .send(pastPayload);

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('past');
        });

        it('should reject booking outside court operating hours (400 Bad Request)', async () => {
            const outsidePayload = {
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: tomorrowDDMMYYYY,
                startTime: '04:00', // Court opens at 06:00
                endTime: '05:30',
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Cookie', customerCookie)
                .send(outsidePayload);

            docLogger.record({
                scenario: 'Outside Operating Hours Rejection',
                method: 'POST',
                endpoint: '/api/bookings',
                requestBody: outsidePayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Rejects requests outside scheduled operating hours.',
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('operating hours');
        });

        it('should reject booking overlapping a scheduled maintenance block (409 Conflict)', async () => {
            const maintPayload = {
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: tomorrowDDMMYYYY,
                startTime: '14:30', // Maintenance is 14:00 to 16:00
                endTime: '15:30',
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Cookie', customerCookie)
                .send(maintPayload);

            docLogger.record({
                scenario: 'Maintenance Window Conflict Rejection',
                method: 'POST',
                endpoint: '/api/bookings',
                requestBody: maintPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Rejects slots conflicting with venue maintenance blocks.',
            });

            expect(res.status).toBe(409);
            expect(res.body.message).toContain('maintenance');
        });
    });

    // -------------------------------------------------------------
    // POST /api/payments/simulate & GET /api/payments/:bookingId
    // -------------------------------------------------------------
    describe('Simulated Payment Lifecycle', () => {
        it('should simulate payment success and generate QC_PAY reference (200 OK)', async () => {
            const payPayload = {
                bookingId: createdBookingId,
                status: 'SUCCESS',
            };

            const res = await request(app)
                .post('/api/payments/simulate')
                .set('Cookie', customerCookie)
                .send(payPayload);

            docLogger.record({
                scenario: 'Simulate Payment Success',
                method: 'POST',
                endpoint: '/api/payments/simulate',
                requestBody: payPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Updates payment status to SUCCESS and generates QC_PAY_DDMMYYYY_HEX reference.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.payment.status).toBe('SUCCESS');
            expect(res.body.data.payment.paymentId).toMatch(/^QC_PAY_\d{8}_[A-F0-9]{8}$/);
            expect(res.body.data.payment.paidAt).toBeDefined();
        });

        it('should retrieve payment details by booking ID (200 OK)', async () => {
            const res = await request(app)
                .get(`/api/payments/${createdBookingId}`)
                .set('Cookie', customerCookie);

            docLogger.record({
                scenario: 'Get Payment Details by Booking ID',
                method: 'GET',
                endpoint: `/api/payments/${createdBookingId}`,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Fetches payment details for authorized customer/owner.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.payment.status).toBe('SUCCESS');
        });
    });

    // -------------------------------------------------------------
    // GET /api/bookings/:bookingId
    // -------------------------------------------------------------
    describe('GET /api/bookings/:bookingId', () => {
        it('should get detailed booking information with joined metadata (200 OK)', async () => {
            const res = await request(app)
                .get(`/api/bookings/${createdBookingId}`)
                .set('Cookie', customerCookie);

            docLogger.record({
                scenario: 'Get Booking Details by ID',
                method: 'GET',
                endpoint: `/api/bookings/${createdBookingId}`,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns booking joined with court, facility, user, and payment data.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.booking.id).toBe(createdBookingId);
            expect(res.body.data.court.name).toBe('Court A (Synthetic)');
            expect(res.body.data.facility.name).toBe('Apex Sports Arena');
            expect(res.body.data.payment.status).toBe('SUCCESS');
        });

        it('should return 403 Forbidden when unauthorized user accesses booking', async () => {
            const res = await request(app)
                .get(`/api/bookings/${createdBookingId}`)
                .set('Cookie', otherCustomerCookie);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    // -------------------------------------------------------------
    // GET /api/users/me/bookings & GET /api/bookings/me
    // -------------------------------------------------------------
    describe('User Bookings History', () => {
        it('should retrieve paginated user bookings list (200 OK)', async () => {
            const res = await request(app)
                .get('/api/users/me/bookings?page=1&limit=10')
                .set('Cookie', customerCookie);

            docLogger.record({
                scenario: 'Get User Bookings History',
                method: 'GET',
                endpoint: '/api/users/me/bookings',
                queryParams: { page: 1, limit: 10 },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns paginated bookings for authenticated user.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.bookings).toBeInstanceOf(Array);
            expect(res.body.data.total).toBeGreaterThanOrEqual(1);
        });
    });

    // -------------------------------------------------------------
    // Owner Views: /api/owner/bookings/*
    // -------------------------------------------------------------
    describe('Owner Booking Views', () => {
        it('should retrieve all bookings for owner facilities (200 OK)', async () => {
            const res = await request(app).get('/api/owner/bookings').set('Cookie', ownerCookie);

            docLogger.record({
                scenario: 'Get Owner Bookings List',
                method: 'GET',
                endpoint: '/api/owner/bookings',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Lists all reservations across owner-operated courts.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.bookings.length).toBeGreaterThanOrEqual(1);
        });

        it('should retrieve upcoming bookings for owner (200 OK)', async () => {
            const res = await request(app)
                .get('/api/owner/bookings/upcoming')
                .set('Cookie', ownerCookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.bookings.length).toBeGreaterThanOrEqual(1);
        });

        it('should retrieve structured calendar view for owner (200 OK)', async () => {
            const res = await request(app)
                .get('/api/owner/bookings/calendar')
                .set('Cookie', ownerCookie);

            docLogger.record({
                scenario: 'Get Owner Booking Calendar',
                method: 'GET',
                endpoint: '/api/owner/bookings/calendar',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns bookings grouped by court for calendar views.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.calendar).toBeInstanceOf(Array);
            expect(res.body.data.calendar.length).toBeGreaterThanOrEqual(1);
        });
    });

    // -------------------------------------------------------------
    // PATCH /api/bookings/:bookingId/cancel (Cancellation Flow)
    // -------------------------------------------------------------
    describe('PATCH /api/bookings/:bookingId/cancel', () => {
        it('should successfully cancel a future confirmed booking (200 OK)', async () => {
            const cancelPayload = {
                cancellationReason: 'Customer requested reschedule',
            };

            const res = await request(app)
                .patch(`/api/bookings/${createdBookingId}/cancel`)
                .set('Cookie', customerCookie)
                .send(cancelPayload);

            docLogger.record({
                scenario: 'Cancel Future Booking (Success)',
                method: 'PATCH',
                endpoint: `/api/bookings/${createdBookingId}/cancel`,
                requestBody: cancelPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Transitions booking to CANCELLED and records cancellation timestamp & reason.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.booking.status).toBe('CANCELLED');
            expect(res.body.data.booking.cancelledAt).toBeDefined();
            expect(res.body.data.booking.cancellationReason).toBe(cancelPayload.cancellationReason);
        });

        it('should reject cancelling an already cancelled booking (409 Conflict)', async () => {
            const res = await request(app)
                .patch(`/api/bookings/${createdBookingId}/cancel`)
                .set('Cookie', customerCookie)
                .send({});

            expect(res.status).toBe(409);
            expect(res.body.message).toContain('already cancelled');
        });

        it('should allow booking the previously cancelled time slot again (201 Created)', async () => {
            const rebookPayload = {
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: tomorrowDDMMYYYY,
                startTime: '10:00',
                endTime: '11:30',
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Cookie', otherCustomerCookie)
                .send(rebookPayload);

            docLogger.record({
                scenario: 'Re-book Cancelled Slot (Success)',
                method: 'POST',
                endpoint: '/api/bookings',
                requestBody: rebookPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Verifies that cancelled booking releases court availability.',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.booking.status).toBe('CONFIRMED');
        });
    });

    // -------------------------------------------------------------
    // Cron Auto-Completion Worker
    // -------------------------------------------------------------
    describe('Booking Auto-Completion Worker', () => {
        it('should auto-complete expired confirmed bookings via cron executor', async () => {
            // Insert a past confirmed booking directly for testing cron
            const pastStart = new Date(Date.now() - 3 * 3600 * 1000);
            const pastEnd = new Date(Date.now() - 1 * 3600 * 1000);

            const [pastBooking] = await db
                .insert(bookings)
                .values({
                    bookingReference: `BK-TEST-PAST-${Date.now()}`,
                    userId: customerUser.id,
                    courtId: testCourt.id,
                    startTime: pastStart,
                    endTime: pastEnd,
                    durationMinutes: 120,
                    priceAmount: '600.00',
                    priceCurrency: 'INR',
                    totalAmount: '1200.00',
                    totalCurrency: 'INR',
                    status: 'CONFIRMED',
                })
                .returning();

            const completedCount = await runBookingStatusCompletion();
            expect(completedCount).toBeGreaterThanOrEqual(1);

            const [checked] = await db
                .select()
                .from(bookings)
                .where(eq(bookings.id, pastBooking.id));

            expect(checked.status).toBe('COMPLETED');
        });
    });
});
