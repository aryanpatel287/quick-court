import request from 'supertest';
import app from '../../app.js';
import { db } from '../../config/database.config.js';
import { facilities } from '../../db/schema/facilities.schema.js';
import { sports } from '../../db/schema/sports.schema.js';
import { facilitySports } from '../../db/schema/facility_sports.schema.js';
import { courts } from '../../db/schema/courts.schema.js';
import { bookings } from '../../db/schema/bookings.schema.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser } from '../helpers/auth-helper.js';
import { generateBookingReference } from '../../utils/date.utils.js';

const docLogger = new FeatureApiDocLogger(
    '06_owner_analytics.md',
    'Feature 06: Facility Owner Bookings & Analytics Dashboard API',
    'Provides facility owners with booking management overviews, KPIs, earnings breakdowns, and revenue trends.',
);

describe('06: Owner Bookings & Analytics Dashboard API', () => {
    let ownerAuth;
    let normalUserAuth;
    let ownerFacility;
    let otherOwnerFacility;
    let ownerCourt;
    let otherOwnerCourt;

    beforeAll(async () => {
        // Create authenticated facility owner
        ownerAuth = await createAndLoginTestUser({ role: 'FACILITY_OWNER' });

        // Create normal user
        normalUserAuth = await createAndLoginTestUser({ role: 'USER' });

        // Create another owner
        const otherOwnerAuth = await createAndLoginTestUser({ role: 'FACILITY_OWNER' });

        // Ensure sport exists
        const [sport] = await db
            .insert(sports)
            .values({
                name: `Tennis_${Date.now()}`,
                slug: `tennis-${Date.now()}`,
                isActive: true,
            })
            .returning();

        // Create facility for owner
        const [fac] = await db
            .insert(facilities)
            .values({
                ownerId: ownerAuth.user.id,
                name: 'Owner Ace Club',
                addressLine: '456 Club Lane',
                city: 'Bangalore',
                state: 'Karnataka',
                venueType: 'OUTDOOR',
                status: 'APPROVED',
            })
            .returning();
        ownerFacility = fac;

        await db.insert(facilitySports).values({
            facilityId: ownerFacility.id,
            sportId: sport.id,
        });

        const [court] = await db
            .insert(courts)
            .values({
                facilityId: ownerFacility.id,
                sportId: sport.id,
                name: 'Center Court',
                priceAmount: '500.00',
                priceCurrency: 'INR',
                isActive: true,
            })
            .returning();
        ownerCourt = court;

        // Create facility for other owner (for IDOR tests)
        const [otherFac] = await db
            .insert(facilities)
            .values({
                ownerId: otherOwnerAuth.user.id,
                name: 'Other Owner Club',
                addressLine: '789 Other Lane',
                city: 'Bangalore',
                state: 'Karnataka',
                venueType: 'INDOOR',
                status: 'APPROVED',
            })
            .returning();
        otherOwnerFacility = otherFac;

        const [otherCourt] = await db
            .insert(courts)
            .values({
                facilityId: otherOwnerFacility.id,
                sportId: sport.id,
                name: 'Court X',
                priceAmount: '600.00',
                priceCurrency: 'INR',
                isActive: true,
            })
            .returning();
        otherOwnerCourt = otherCourt;

        // Add bookings for owner's court
        // 1. Upcoming CONFIRMED booking
        const futureStart = new Date();
        futureStart.setDate(futureStart.getDate() + 3);
        futureStart.setHours(10, 0, 0, 0);
        const futureEnd = new Date(futureStart);
        futureEnd.setHours(11, 0, 0, 0);

        await db.insert(bookings).values({
            bookingReference: generateBookingReference(
                Math.floor(Math.random() * 900000) + 100000,
                futureStart,
            ),
            userId: normalUserAuth.user.id,
            courtId: ownerCourt.id,
            startTime: futureStart,
            endTime: futureEnd,
            durationMinutes: 60,
            priceAmount: '500.00',
            priceCurrency: 'INR',
            totalAmount: '500.00',
            totalCurrency: 'INR',
            status: 'CONFIRMED',
        });

        // 2. Past COMPLETED booking
        const pastStart = new Date();
        pastStart.setDate(pastStart.getDate() - 2);
        pastStart.setHours(14, 0, 0, 0);
        const pastEnd = new Date(pastStart);
        pastEnd.setHours(15, 0, 0, 0);

        await db.insert(bookings).values({
            bookingReference: generateBookingReference(
                Math.floor(Math.random() * 900000) + 100000,
                pastStart,
            ),
            userId: normalUserAuth.user.id,
            courtId: ownerCourt.id,
            startTime: pastStart,
            endTime: pastEnd,
            durationMinutes: 60,
            priceAmount: '500.00',
            priceCurrency: 'INR',
            totalAmount: '500.00',
            totalCurrency: 'INR',
            status: 'COMPLETED',
        });

        // 3. CANCELLED booking
        const cancelStart = new Date();
        cancelStart.setDate(cancelStart.getDate() - 1);
        cancelStart.setHours(16, 0, 0, 0);
        const cancelEnd = new Date(cancelStart);
        cancelEnd.setHours(17, 0, 0, 0);

        await db.insert(bookings).values({
            bookingReference: generateBookingReference(
                Math.floor(Math.random() * 900000) + 100000,
                cancelStart,
            ),
            userId: normalUserAuth.user.id,
            courtId: ownerCourt.id,
            startTime: cancelStart,
            endTime: cancelEnd,
            durationMinutes: 60,
            priceAmount: '500.00',
            priceCurrency: 'INR',
            totalAmount: '500.00',
            totalCurrency: 'INR',
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason: 'Rain',
        });

        // 4. Booking for OTHER owner (must not leak to ownerAuth)
        await db.insert(bookings).values({
            bookingReference: generateBookingReference(
                Math.floor(Math.random() * 900000) + 100000,
                futureStart,
            ),
            userId: normalUserAuth.user.id,
            courtId: otherOwnerCourt.id,
            startTime: futureStart,
            endTime: futureEnd,
            durationMinutes: 60,
            priceAmount: '600.00',
            priceCurrency: 'INR',
            totalAmount: '600.00',
            totalCurrency: 'INR',
            status: 'CONFIRMED',
        });
    });

    afterAll(() => {
        docLogger.save();
    });

    describe('RBAC & Authorization', () => {
        it('should return 403 Forbidden when accessed by normal USER', async () => {
            const res = await request(app)
                .get('/api/owner/bookings')
                .set('Cookie', normalUserAuth.cookie);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should return 401 Unauthorized when not logged in', async () => {
            const res = await request(app).get('/api/owner/bookings');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/owner/bookings', () => {
        it('should list bookings belonging only to the authenticated owner (200 OK)', async () => {
            const res = await request(app)
                .get('/api/owner/bookings')
                .set('Cookie', ownerAuth.cookie);

            docLogger.record({
                scenario: 'List Owner Bookings (All)',
                method: 'GET',
                endpoint: '/api/owner/bookings',
                headers: { Cookie: '[FACILITY_OWNER Token]' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns bookings belonging only to owner courts with customer metadata.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.bookings)).toBe(true);

            // Verify owner isolation: other owner's booking not present
            const hasOtherBooking = res.body.bookings.some(
                (b) => b.court.id === otherOwnerCourt.id,
            );
            expect(hasOtherBooking).toBe(false);
        });
    });

    describe('GET /api/owner/bookings/upcoming', () => {
        it('should list upcoming confirmed bookings (200 OK)', async () => {
            const res = await request(app)
                .get('/api/owner/bookings/upcoming')
                .set('Cookie', ownerAuth.cookie);

            docLogger.record({
                scenario: 'List Owner Upcoming Bookings',
                method: 'GET',
                endpoint: '/api/owner/bookings/upcoming',
                headers: { Cookie: '[FACILITY_OWNER Token]' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns future bookings with status CONFIRMED.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.bookings)).toBe(true);
            res.body.bookings.forEach((b) => {
                expect(b.status).toBe('CONFIRMED');
                expect(new Date(b.startTime).getTime()).toBeGreaterThan(Date.now());
            });
        });
    });

    describe('GET /api/owner/bookings/past', () => {
        it('should list past and cancelled bookings (200 OK)', async () => {
            const res = await request(app)
                .get('/api/owner/bookings/past')
                .set('Cookie', ownerAuth.cookie);

            docLogger.record({
                scenario: 'List Owner Past Bookings',
                method: 'GET',
                endpoint: '/api/owner/bookings/past',
                headers: { Cookie: '[FACILITY_OWNER Token]' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns completed, cancelled, or passed start time bookings.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.bookings)).toBe(true);
        });
    });

    describe('GET /api/owner/bookings/calendar', () => {
        it('should get monthly calendar bookings (200 OK)', async () => {
            const now = new Date();
            const res = await request(app)
                .get('/api/owner/bookings/calendar')
                .query({ month: now.getMonth() + 1, year: now.getFullYear() })
                .set('Cookie', ownerAuth.cookie);

            docLogger.record({
                scenario: 'Get Owner Calendar Bookings',
                method: 'GET',
                endpoint: '/api/owner/bookings/calendar',
                queryParams: { month: now.getMonth() + 1, year: now.getFullYear() },
                headers: { Cookie: '[FACILITY_OWNER Token]' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns confirmed/completed bookings mapped to a monthly calendar window.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.bookings)).toBe(true);
        });
    });

    describe('GET /api/owner/dashboard/summary', () => {
        it('should retrieve dashboard KPI summary (200 OK)', async () => {
            const res = await request(app)
                .get('/api/owner/dashboard/summary')
                .set('Cookie', ownerAuth.cookie);

            docLogger.record({
                scenario: 'Get Owner Dashboard KPI Summary',
                method: 'GET',
                endpoint: '/api/owner/dashboard/summary',
                headers: { Cookie: '[FACILITY_OWNER Token]' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns total bookings, earnings (excluding cancelled), and active assets.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(typeof res.body.data.totalBookings).toBe('number');
            expect(typeof res.body.data.totalEarnings).toBe('number');
            expect(res.body.data.currency).toBe('INR');
            expect(res.body.data.activeFacilities).toBeGreaterThanOrEqual(1);
            expect(res.body.data.activeCourts).toBeGreaterThanOrEqual(1);
        });
    });

    describe('GET /api/owner/dashboard/bookings-trend', () => {
        it('should retrieve daily bookings trend (200 OK)', async () => {
            const res = await request(app)
                .get('/api/owner/dashboard/bookings-trend')
                .query({ period: 'daily' })
                .set('Cookie', ownerAuth.cookie);

            docLogger.record({
                scenario: 'Get Bookings Trend (Daily)',
                method: 'GET',
                endpoint: '/api/owner/dashboard/bookings-trend',
                queryParams: { period: 'daily' },
                headers: { Cookie: '[FACILITY_OWNER Token]' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns timeline of bookings count and revenue in DD-MM-YYYY format.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.trends)).toBe(true);
        });
    });

    describe('GET /api/owner/dashboard/earnings', () => {
        it('should retrieve detailed earnings breakdown (200 OK)', async () => {
            const res = await request(app)
                .get('/api/owner/dashboard/earnings')
                .set('Cookie', ownerAuth.cookie);

            docLogger.record({
                scenario: 'Get Detailed Earnings Breakdown',
                method: 'GET',
                endpoint: '/api/owner/dashboard/earnings',
                headers: { Cookie: '[FACILITY_OWNER Token]' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Breakdown of earnings by court, by facility, and monthly timeline.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.earningsByCourt).toBeDefined();
            expect(res.body.data.earningsByFacility).toBeDefined();
        });
    });

    describe('GET /api/owner/dashboard/peak-hours', () => {
        it('should retrieve 24-hour peak hours distribution (200 OK)', async () => {
            const res = await request(app)
                .get('/api/owner/dashboard/peak-hours')
                .set('Cookie', ownerAuth.cookie);

            docLogger.record({
                scenario: 'Get Peak Booking Hours Distribution',
                method: 'GET',
                endpoint: '/api/owner/dashboard/peak-hours',
                headers: { Cookie: '[FACILITY_OWNER Token]' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns 24-hour hourly distribution of booking volumes.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.peakHours)).toBe(true);
            expect(res.body.peakHours.length).toBe(24);
        });
    });
});
