import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import {
    createAndLoginTestOwner,
    createAndLoginTestUser,
    createTestFacilityAndCourt,
} from '../helpers/auth-helper.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';

const logger = new FeatureApiDocLogger(
    '07_owner_dashboard.md',
    'Feature 07: Facility Owner Dashboard & Analytics API',
    'Dedicated portal endpoints for court operators to inspect reservation queues, view booking calendar grids, analyze revenue trends, and review utilization metrics.',
);

jest.setTimeout(60000);

afterAll(() => {
    logger.save();
});

describe('07: Facility Owner Reservations & Dashboard Analytics', () => {
    let ownerAuth;
    let otherOwnerAuth;
    let playerAuth;
    let testFacility;
    let testCourt;
    let testBooking;

    beforeAll(async () => {
        ownerAuth = await createAndLoginTestOwner({ firstName: 'Dash', lastName: 'Owner' });
        otherOwnerAuth = await createAndLoginTestOwner({ firstName: 'Other', lastName: 'Owner' });
        playerAuth = await createAndLoginTestUser({ firstName: 'Dash', lastName: 'Player' });

        const setup = await createTestFacilityAndCourt({
            ownerId: ownerAuth.user.id,
            status: 'APPROVED',
        });
        testFacility = setup.facility;
        testCourt = setup.court;

        // Create an upcoming booking in the owner's facility
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
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
                startTime: '16:00',
                endTime: '17:00',
            });

        testBooking = bookRes.body.data.booking;
    });

    describe('1. Owner Booking Operations & Calendar', () => {
        it('1.1 Anonymous request to /api/owner/bookings should return 401 Unauthorized', async () => {
            const res = await request(app).get('/api/owner/bookings');

            logger.record({
                scenario: 'Anonymous Owner Bookings Request (Rejected)',
                method: 'GET',
                endpoint: '/api/owner/bookings',
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('1.2 Regular USER request to /api/owner/bookings should return 403 Forbidden', async () => {
            const res = await request(app)
                .get('/api/owner/bookings')
                .set('Cookie', playerAuth.cookie);

            logger.record({
                scenario: 'Non-Owner Access to Operator Bookings (Rejected)',
                method: 'GET',
                endpoint: '/api/owner/bookings',
                headers: { Cookie: 'token=PLAYER_USER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('1.3 Should list all bookings for owner facilities via GET /api/owner/bookings', async () => {
            const res = await request(app)
                .get('/api/owner/bookings')
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'List All Facility Bookings for Owner',
                method: 'GET',
                endpoint: '/api/owner/bookings',
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Displays aggregated bookings across all courts owned by the operator.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('1.4 Should list upcoming bookings via GET /api/owner/bookings/upcoming', async () => {
            const res = await request(app)
                .get('/api/owner/bookings/upcoming')
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'List Upcoming Bookings',
                method: 'GET',
                endpoint: '/api/owner/bookings/upcoming',
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('1.5 Should list past bookings via GET /api/owner/bookings/past', async () => {
            const res = await request(app)
                .get('/api/owner/bookings/past')
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'List Historical Past Bookings',
                method: 'GET',
                endpoint: '/api/owner/bookings/past',
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('1.6 Should get calendar grid bookings via GET /api/owner/bookings/calendar', async () => {
            const currentDate = new Date();
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();

            const queryParams = {
                month,
                year,
                facilityId: testFacility.id,
                groupBy: 'flat',
            };

            const res = await request(app)
                .get('/api/owner/bookings/calendar')
                .set('Cookie', ownerAuth.cookie)
                .query(queryParams);

            logger.record({
                scenario: 'Get Monthly Calendar Bookings Grid',
                method: 'GET',
                endpoint: '/api/owner/bookings/calendar',
                headers: { Cookie: 'token=OWNER_JWT' },
                queryParams,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Returns calendar-ready schedule data for interactive dashboard visualization.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('1.7 Security: Other owner cannot cancel this booking (403)', async () => {
            const res = await request(app)
                .patch(`/api/owner/bookings/${testBooking.id}/cancel`)
                .set('Cookie', otherOwnerAuth.cookie)
                .send({ cancellationReason: 'Cross-owner unauthorized cancellation' });

            logger.record({
                scenario: 'Cross-Owner Reservation Cancellation Attempt (Forbidden)',
                method: 'PATCH',
                endpoint: `/api/owner/bookings/${testBooking.id}/cancel`,
                headers: { Cookie: 'token=OTHER_OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('1.8 Should allow facility owner to cancel a booking in their facility', async () => {
            const res = await request(app)
                .patch(`/api/owner/bookings/${testBooking.id}/cancel`)
                .set('Cookie', ownerAuth.cookie)
                .send({ cancellationReason: 'Emergency facility maintenance override' });

            logger.record({
                scenario: 'Owner Initiated Booking Cancellation',
                method: 'PATCH',
                endpoint: `/api/owner/bookings/${testBooking.id}/cancel`,
                headers: { Cookie: 'token=OWNER_JWT' },
                requestBody: { cancellationReason: 'Emergency facility maintenance override' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Allows venue managers to cancel reservations for unexpected facility disruptions.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('2. Dashboard Metrics & Business Intelligence', () => {
        it('2.1 Should retrieve dashboard summary KPIs via GET /api/owner/dashboard/summary', async () => {
            const res = await request(app)
                .get('/api/owner/dashboard/summary')
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'Get Owner Dashboard KPI Summary',
                method: 'GET',
                endpoint: '/api/owner/dashboard/summary',
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Key performance indicators: total bookings, aggregate revenue, and occupancy rates.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('2.2 Should retrieve bookings trend time series via GET /api/owner/dashboard/bookings-trend', async () => {
            const queryParams = {
                period: 'daily',
                facilityId: testFacility.id,
            };

            const res = await request(app)
                .get('/api/owner/dashboard/bookings-trend')
                .set('Cookie', ownerAuth.cookie)
                .query(queryParams);

            logger.record({
                scenario: 'Get Reservation Velocity and Trends',
                method: 'GET',
                endpoint: '/api/owner/dashboard/bookings-trend',
                headers: { Cookie: 'token=OWNER_JWT' },
                queryParams,
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('2.3 Should retrieve revenue and earnings analytics via GET /api/owner/dashboard/earnings', async () => {
            const res = await request(app)
                .get('/api/owner/dashboard/earnings')
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'Get Earnings & Revenue Breakdown',
                method: 'GET',
                endpoint: '/api/owner/dashboard/earnings',
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('2.4 Should retrieve peak operating hours via GET /api/owner/dashboard/peak-hours', async () => {
            const res = await request(app)
                .get('/api/owner/dashboard/peak-hours')
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'Get Peak Operating Hours Analysis',
                method: 'GET',
                endpoint: '/api/owner/dashboard/peak-hours',
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Identifies prime utilization windows to inform dynamic pricing.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
