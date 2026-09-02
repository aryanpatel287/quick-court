import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { createAndLoginTestUser, createTestFacilityAndCourt } from '../helpers/auth-helper.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';

const logger = new FeatureApiDocLogger(
    '06_payment_simulation.md',
    'Feature 06: Payment Simulation & Receipts API',
    'Sandbox payment simulator endpoints enabling immediate settlement (SUCCESS) or rejection (FAILED) of court reservations with generated transaction reference keys.',
);

jest.setTimeout(60000);

afterAll(() => {
    logger.save();
});

describe('06: Payment Simulation & Transaction Receipts', () => {
    let playerAuth;
    let otherPlayerAuth;
    let testFacility;
    let testCourt;
    let testBooking;

    beforeAll(async () => {
        playerAuth = await createAndLoginTestUser({ firstName: 'Pay', lastName: 'Player' });
        otherPlayerAuth = await createAndLoginTestUser({ firstName: 'Other', lastName: 'Player' });

        const setup = await createTestFacilityAndCourt({ status: 'APPROVED' });
        testFacility = setup.facility;
        testCourt = setup.court;

        // Seed a booking for the player
        const futureDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
        const day = String(futureDate.getDate()).padStart(2, '0');
        const month = String(futureDate.getMonth() + 1).padStart(2, '0');
        const year = futureDate.getFullYear();
        const dateStr = `${day}-${month}-${year}`;

        const bookRes = await request(app)
            .post('/api/bookings')
            .set('Cookie', playerAuth.cookie)
            .send({
                facilityId: testFacility.id,
                courtId: testCourt.id,
                bookingDate: dateStr,
                startTime: '14:00',
                endTime: '15:00',
            });

        testBooking = bookRes.body.data.booking;
    });

    describe('1. Payment Simulation (SUCCESS & FAILED)', () => {
        it('1.1 Anonymous request to /api/payments/simulate should return 401 Unauthorized', async () => {
            const res = await request(app).post('/api/payments/simulate').send({
                bookingId: testBooking.id,
                status: 'SUCCESS',
            });

            logger.record({
                scenario: 'Anonymous Payment Simulation Attempt (Rejected)',
                method: 'POST',
                endpoint: '/api/payments/simulate',
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('1.2 Security: Other player cannot simulate payment for another user booking (403)', async () => {
            const res = await request(app)
                .post('/api/payments/simulate')
                .set('Cookie', otherPlayerAuth.cookie)
                .send({
                    bookingId: testBooking.id,
                    status: 'SUCCESS',
                });

            logger.record({
                scenario: 'Unauthorized Payment Processing Attempt (403)',
                method: 'POST',
                endpoint: '/api/payments/simulate',
                headers: { Cookie: 'token=OTHER_USER_JWT' },
                requestBody: { bookingId: testBooking.id, status: 'SUCCESS' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('1.3 Should reject invalid payment status values (400)', async () => {
            const res = await request(app)
                .post('/api/payments/simulate')
                .set('Cookie', playerAuth.cookie)
                .send({
                    bookingId: testBooking.id,
                    status: 'INVALID_STATUS',
                });

            logger.record({
                scenario: 'Invalid Payment Status Attempt (400)',
                method: 'POST',
                endpoint: '/api/payments/simulate',
                headers: { Cookie: 'token=USER_JWT' },
                requestBody: { bookingId: testBooking.id, status: 'INVALID_STATUS' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('1.4 Should successfully simulate SUCCESS payment and generate transaction reference', async () => {
            const payload = {
                bookingId: testBooking.id,
                status: 'SUCCESS',
            };

            const res = await request(app)
                .post('/api/payments/simulate')
                .set('Cookie', playerAuth.cookie)
                .send(payload);

            logger.record({
                scenario: 'Simulate Successful Payment Settlement',
                method: 'POST',
                endpoint: '/api/payments/simulate',
                headers: { Cookie: 'token=USER_JWT' },
                requestBody: payload,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Updates payment record to SUCCESS, populates paidAt timestamp, and assigns unique transaction reference.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.payment.status).toBe('SUCCESS');
            expect(res.body.data.payment.paymentId).toBeDefined();
            expect(res.body.data.payment.paidAt).not.toBeNull();
        });
    });

    describe('2. Payment Details Retrieval', () => {
        it('2.1 Should retrieve payment details by booking ID via GET /api/payments/:bookingId', async () => {
            const res = await request(app)
                .get(`/api/payments/${testBooking.id}`)
                .set('Cookie', playerAuth.cookie);

            logger.record({
                scenario: 'Get Payment Details by Booking ID',
                method: 'GET',
                endpoint: `/api/payments/${testBooking.id}`,
                headers: { Cookie: 'token=USER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Fetches payment status, transaction ID, amounts, and settlement metadata.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.payment.bookingId).toBe(testBooking.id);
            expect(res.body.data.payment.status).toBe('SUCCESS');
        });

        it('2.2 Security: Unrelated player cannot view payment details for this booking (403)', async () => {
            const res = await request(app)
                .get(`/api/payments/${testBooking.id}`)
                .set('Cookie', otherPlayerAuth.cookie);

            logger.record({
                scenario: 'Cross-User Payment Details Access Attempt (Rejected)',
                method: 'GET',
                endpoint: `/api/payments/${testBooking.id}`,
                headers: { Cookie: 'token=OTHER_USER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });
});
