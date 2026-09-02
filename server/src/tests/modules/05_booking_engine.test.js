import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { createAndLoginTestUser, createTestFacilityAndCourt } from '../helpers/auth-helper.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';

const logger = new FeatureApiDocLogger(
    '05_booking_engine.md',
    'Feature 05: Booking Engine & Collision Checking API',
    'Core transactional booking workflow including slot reservation, collision detection (overlapping time rejections), booking retrieval, cancellation, and user history.',
);

jest.setTimeout(60000);

afterAll(() => {
    logger.save();
});

describe('05: Booking Engine & Collision Checking', () => {
    let userAuth;
    let otherUserAuth;
    let testFacility;
    let testCourt;
    let createdBooking;
    let bookingDateString;

    beforeAll(async () => {
        userAuth = await createAndLoginTestUser({ firstName: 'Booking', lastName: 'Player1' });
        otherUserAuth = await createAndLoginTestUser({ firstName: 'Other', lastName: 'Player2' });

        const setup = await createTestFacilityAndCourt({ status: 'APPROVED' });
        testFacility = setup.facility;
        testCourt = setup.court;

        // Choose a future date: 5 days from now
        const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
        const day = String(futureDate.getDate()).padStart(2, '0');
        const month = String(futureDate.getMonth() + 1).padStart(2, '0');
        const year = futureDate.getFullYear();
        bookingDateString = `${day}-${month}-${year}`;
    });

    describe('1. Booking Creation & Collision Rejections', () => {
        it('1.1 Anonymous request to create booking should return 401 Unauthorized', async () => {
            const res = await request(app).post('/api/bookings').send({
                courtId: testCourt.id,
                bookingDate: bookingDateString,
                startTime: '10:00',
                endTime: '11:00',
            });

            logger.record({
                scenario: 'Anonymous Booking Creation Attempt (Rejected)',
                method: 'POST',
                endpoint: '/api/bookings',
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Requires active authenticated session to initiate reservations.',
            });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('1.2 Should create a CONFIRMED booking and pending payment record successfully', async () => {
            const bookingPayload = {
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: bookingDateString,
                startTime: '10:00',
                endTime: '11:00',
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Cookie', userAuth.cookie)
                .send(bookingPayload);

            logger.record({
                scenario: 'Create Booking (Success)',
                method: 'POST',
                endpoint: '/api/bookings',
                headers: { Cookie: 'token=USER_JWT' },
                requestBody: bookingPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Calculates price, generates booking reference, and creates pending payment record in an atomic transaction.',
            });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.booking).toBeDefined();
            expect(res.body.data.booking.status).toBe('CONFIRMED');
            expect(res.body.data.payment).toBeDefined();
            expect(Number(res.body.data.booking.totalAmount)).toBeGreaterThan(0);

            createdBooking = res.body.data.booking;
        });

        it('1.3 Collision Detection: Should reject duplicate booking on identical time slot (409)', async () => {
            const duplicatePayload = {
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: bookingDateString,
                startTime: '10:00',
                endTime: '11:00',
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Cookie', otherUserAuth.cookie)
                .send(duplicatePayload);

            logger.record({
                scenario: 'Double-Booking Collision Rejection (Exact Overlap)',
                method: 'POST',
                endpoint: '/api/bookings',
                headers: { Cookie: 'token=OTHER_USER_JWT' },
                requestBody: duplicatePayload,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Enforces strict collision detection preventing double-booking of confirmed slots.',
            });

            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('1.4 Collision Detection: Should reject partial overlapping time slot (409)', async () => {
            const partialOverlapPayload = {
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: bookingDateString,
                startTime: '10:30',
                endTime: '11:30', // overlaps 10:00 - 11:00
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Cookie', otherUserAuth.cookie)
                .send(partialOverlapPayload);

            logger.record({
                scenario: 'Double-Booking Collision Rejection (Partial Overlap)',
                method: 'POST',
                endpoint: '/api/bookings',
                headers: { Cookie: 'token=OTHER_USER_JWT' },
                requestBody: partialOverlapPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('1.5 Should allow adjacent non-overlapping booking immediately following existing booking', async () => {
            const adjacentPayload = {
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: bookingDateString,
                startTime: '11:00', // Exactly at previous end time
                endTime: '12:00',
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Cookie', otherUserAuth.cookie)
                .send(adjacentPayload);

            logger.record({
                scenario: 'Create Adjacent Booking (Boundary Condition Success)',
                method: 'POST',
                endpoint: '/api/bookings',
                headers: { Cookie: 'token=OTHER_USER_JWT' },
                requestBody: adjacentPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Verifies boundary collision logic allows adjacent back-to-back bookings.',
            });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
        });
    });

    describe('2. Booking Details & User History', () => {
        it('2.1 Should retrieve booking confirmation details by ID', async () => {
            const res = await request(app)
                .get(`/api/bookings/${createdBooking.id}`)
                .set('Cookie', userAuth.cookie);

            logger.record({
                scenario: 'Get Booking Confirmation Details',
                method: 'GET',
                endpoint: `/api/bookings/${createdBooking.id}`,
                headers: { Cookie: 'token=USER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Retrieves booking with joined facility, court, and payment snapshot.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.booking.id).toBe(createdBooking.id);
        });

        it('2.2 Security: Unrelated user cannot view another user booking (403)', async () => {
            const res = await request(app)
                .get(`/api/bookings/${createdBooking.id}`)
                .set('Cookie', otherUserAuth.cookie);

            logger.record({
                scenario: 'Cross-User Booking Access Attempt (Rejected)',
                method: 'GET',
                endpoint: `/api/bookings/${createdBooking.id}`,
                headers: { Cookie: 'token=UNAUTHORIZED_USER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('2.3 Should list user booking history via GET /api/bookings/me', async () => {
            const res = await request(app).get('/api/bookings/me').set('Cookie', userAuth.cookie);

            logger.record({
                scenario: 'List My Bookings History',
                method: 'GET',
                endpoint: '/api/bookings/me',
                headers: { Cookie: 'token=USER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Lists active and historical bookings for the authenticated player.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.bookings)).toBe(true);
            const found = res.body.data.bookings.some(
                (b) => (b.booking ? b.booking.id : b.id) === createdBooking.id,
            );
            expect(found).toBe(true);
        });
    });

    describe('3. Booking Cancellation & Slot Release', () => {
        it('3.1 Should cancel a future booking via PATCH /api/bookings/:bookingId/cancel', async () => {
            const cancelPayload = {
                cancellationReason: 'Change in personal schedule',
            };

            const res = await request(app)
                .patch(`/api/bookings/${createdBooking.id}/cancel`)
                .set('Cookie', userAuth.cookie)
                .send(cancelPayload);

            logger.record({
                scenario: 'Cancel Future Booking',
                method: 'PATCH',
                endpoint: `/api/bookings/${createdBooking.id}/cancel`,
                headers: { Cookie: 'token=USER_JWT' },
                requestBody: cancelPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Transitions status to CANCELLED and marks the time slot as open again.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.booking.status).toBe('CANCELLED');
        });

        it('3.2 Should now allow booking the previously cancelled slot', async () => {
            const rebookPayload = {
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: bookingDateString,
                startTime: '10:00',
                endTime: '11:00', // Was previously blocked, now released!
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Cookie', otherUserAuth.cookie)
                .send(rebookPayload);

            logger.record({
                scenario: 'Re-Book Released Slot After Cancellation',
                method: 'POST',
                endpoint: '/api/bookings',
                headers: { Cookie: 'token=OTHER_USER_JWT' },
                requestBody: rebookPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Verifies that cancelling a reservation releases the slot back to the public pool.',
            });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
        });
    });
});
