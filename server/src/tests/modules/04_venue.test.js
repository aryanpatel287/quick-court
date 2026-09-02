import request from 'supertest';
import app from '../../app.js';
import { db } from '../../config/database.config.js';
import { facilities } from '../../db/schema/facilities.schema.js';
import { sports } from '../../db/schema/sports.schema.js';
import { facilitySports } from '../../db/schema/facility_sports.schema.js';
import { facilityPhotos } from '../../db/schema/facility_photos.schema.js';
import { courts } from '../../db/schema/courts.schema.js';
import { courtOperatingHours } from '../../db/schema/court_operating_hours.schema.js';
import { maintenanceBlocks } from '../../db/schema/maintenance_blocks.schema.js';
import { bookings } from '../../db/schema/bookings.schema.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser } from '../helpers/auth-helper.js';
import { formatDateToDDMMYYYY, generateBookingReference } from '../../utils/date.utils.js';

const docLogger = new FeatureApiDocLogger(
    '04_venue_discovery.md',
    'Feature 04: Public Venue Discovery & Availability API',
    'Provides public discovery of approved sports venues, courts, and real-time slot availability.',
);

describe('04: Public Venue Discovery & Availability API', () => {
    let ownerUser;
    let normalUser;
    let approvedFacility;
    let pendingFacility;
    let testSport;
    let activeCourt;
    let futureDate;
    let futureDateFormatted;

    beforeAll(async () => {
        // Create owner and normal users
        const ownerAuth = await createAndLoginTestUser({ role: 'FACILITY_OWNER' });
        ownerUser = ownerAuth.user;

        const userAuth = await createAndLoginTestUser({ role: 'USER' });
        normalUser = userAuth.user;

        // Ensure a sport exists
        const [sport] = await db
            .insert(sports)
            .values({
                name: `Badminton_${Date.now()}`,
                slug: `badminton-${Date.now()}`,
                isActive: true,
            })
            .returning();
        testSport = sport;

        // Create APPROVED facility
        const [appFac] = await db
            .insert(facilities)
            .values({
                ownerId: ownerUser.id,
                name: 'Apex Sports Arena',
                description: 'State of the art indoor badminton facility',
                addressLine: '123 Court Road',
                city: 'Mumbai',
                state: 'Maharashtra',
                postalCode: '400001',
                venueType: 'INDOOR',
                status: 'APPROVED',
            })
            .returning();
        approvedFacility = appFac;

        // Link sport to approved facility
        await db.insert(facilitySports).values({
            facilityId: approvedFacility.id,
            sportId: testSport.id,
        });

        // Add facility photo
        await db.insert(facilityPhotos).values({
            facilityId: approvedFacility.id,
            imageUrl: 'https://images.unsplash.com/photo-1544919982-b61976f0ba43',
            isPrimary: true,
            displayOrder: 0,
        });

        // Add active court
        const [court] = await db
            .insert(courts)
            .values({
                facilityId: approvedFacility.id,
                sportId: testSport.id,
                name: 'Court 1 - Wooden',
                priceAmount: '400.00',
                priceCurrency: 'INR',
                isActive: true,
            })
            .returning();
        activeCourt = court;

        // Add operating hours (0-6 all open from 06:00 to 22:00)
        for (let d = 0; d < 7; d++) {
            await db.insert(courtOperatingHours).values({
                courtId: activeCourt.id,
                dayOfWeek: d,
                startTime: '06:00:00',
                endTime: '22:00:00',
                isClosed: false,
            });
        }

        // Set future date for availability testing
        futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        futureDateFormatted = formatDateToDDMMYYYY(futureDate, '-');

        // Add a confirmed booking on future date at 08:00 - 09:00 UTC
        const bookingStart = new Date(futureDate);
        bookingStart.setHours(8, 0, 0, 0);
        const bookingEnd = new Date(futureDate);
        bookingEnd.setHours(9, 0, 0, 0);

        await db.insert(bookings).values({
            bookingReference: generateBookingReference(
                Math.floor(Math.random() * 900000) + 100000,
                futureDate,
            ),
            userId: normalUser.id,
            courtId: activeCourt.id,
            startTime: bookingStart,
            endTime: bookingEnd,
            durationMinutes: 60,
            priceAmount: '400.00',
            priceCurrency: 'INR',
            totalAmount: '400.00',
            totalCurrency: 'INR',
            status: 'CONFIRMED',
        });

        // Add a maintenance block on future date at 12:00 - 13:00
        const maintStart = new Date(futureDate);
        maintStart.setHours(12, 0, 0, 0);
        const maintEnd = new Date(futureDate);
        maintEnd.setHours(13, 0, 0, 0);

        await db.insert(maintenanceBlocks).values({
            courtId: activeCourt.id,
            createdBy: ownerUser.id,
            startTime: maintStart,
            endTime: maintEnd,
            reason: 'Floor polishing',
        });

        // Create PENDING facility (should be hidden from public discovery)
        const [penFac] = await db
            .insert(facilities)
            .values({
                ownerId: ownerUser.id,
                name: 'Pending Secret Arena',
                addressLine: '999 Secret Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                venueType: 'OUTDOOR',
                status: 'PENDING',
            })
            .returning();
        pendingFacility = penFac;
    });

    afterAll(() => {
        docLogger.save();
    });

    describe('GET /api/venues', () => {
        it('should list approved venues with pagination (200 OK)', async () => {
            const res = await request(app).get('/api/venues').query({ page: 1, limit: 10 });

            docLogger.record({
                scenario: 'List Approved Venues (Public)',
                method: 'GET',
                endpoint: '/api/venues',
                queryParams: { page: 1, limit: 10 },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns approved public venues with prices, primary photo, and ratings.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.venues)).toBe(true);
            expect(res.body.pagination).toBeDefined();

            // Verify approved facility is in results
            const foundApproved = res.body.venues.some((v) => v.id === approvedFacility.id);
            expect(foundApproved).toBe(true);

            // Verify PENDING facility is NOT in results (Public gate)
            const foundPending = res.body.venues.some((v) => v.id === pendingFacility.id);
            expect(foundPending).toBe(false);
        });

        it('should filter venues by city and venueType (200 OK)', async () => {
            const res = await request(app)
                .get('/api/venues')
                .query({ city: 'Mumbai', venueType: 'INDOOR' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const matches = res.body.venues.filter(
                (v) => v.city === 'Mumbai' && v.venueType === 'INDOOR',
            );
            expect(matches.length).toBeGreaterThan(0);
        });

        it('should return 400 for invalid venueType filter', async () => {
            const res = await request(app).get('/api/venues').query({ venueType: 'invalid_type' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/venues/:venueId', () => {
        it('should get approved venue details (200 OK)', async () => {
            const res = await request(app).get(`/api/venues/${approvedFacility.id}`);

            docLogger.record({
                scenario: 'Get Venue Details (Public)',
                method: 'GET',
                endpoint: `/api/venues/${approvedFacility.id}`,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns full venue information including photos, sports, and court list.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.venue.id).toBe(approvedFacility.id);
            expect(res.body.venue.name).toBe(approvedFacility.name);
            expect(res.body.venue.ownerId).toBeUndefined(); // Sensitive field hidden
            expect(res.body.venue.rejectionReason).toBeUndefined(); // Sensitive field hidden
            expect(Array.isArray(res.body.venue.courts)).toBe(true);
            expect(res.body.venue.priceRange).toBeDefined();
        });

        it('should return 404 for non-approved or non-existent venue', async () => {
            const res = await request(app).get(`/api/venues/${pendingFacility.id}`);

            docLogger.record({
                scenario: 'Get Unapproved Venue (Public Gate Enforced)',
                method: 'GET',
                endpoint: `/api/venues/${pendingFacility.id}`,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Unapproved (PENDING) facility returns 404, never revealing its existence.',
            });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/venues/:venueId/courts', () => {
        it('should list active courts for an approved venue (200 OK)', async () => {
            const res = await request(app).get(`/api/venues/${approvedFacility.id}/courts`);

            docLogger.record({
                scenario: 'Get Venue Active Courts',
                method: 'GET',
                endpoint: `/api/venues/${approvedFacility.id}/courts`,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Lists active courts and current pricing for an approved venue.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.courts)).toBe(true);
            expect(res.body.courts.some((c) => c.id === activeCourt.id)).toBe(true);
        });
    });

    describe('GET /api/venues/:venueId/availability', () => {
        it('should return slot availability for a date (200 OK)', async () => {
            const res = await request(app)
                .get(`/api/venues/${approvedFacility.id}/availability`)
                .query({
                    courtId: activeCourt.id,
                    date: futureDateFormatted,
                });

            docLogger.record({
                scenario: 'Get Court Slot Availability',
                method: 'GET',
                endpoint: `/api/venues/${approvedFacility.id}/availability`,
                queryParams: {
                    courtId: activeCourt.id,
                    date: futureDateFormatted,
                },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns computed slot statuses: available, booked, maintenance_blocked, or past.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.courtId).toBe(activeCourt.id);
            expect(res.body.date).toBe(futureDateFormatted);
            expect(Array.isArray(res.body.slots)).toBe(true);

            // Verify booked slot at 08:00
            const bookedSlot = res.body.slots.find((s) => s.startTime === '08:00');
            expect(bookedSlot).toBeDefined();
            expect(bookedSlot.status).toBe('booked');

            // Verify maintenance blocked slot at 12:00
            const maintSlot = res.body.slots.find((s) => s.startTime === '12:00');
            expect(maintSlot).toBeDefined();
            expect(maintSlot.status).toBe('maintenance_blocked');

            // Verify available slot at 06:00
            const availSlot = res.body.slots.find((s) => s.startTime === '06:00');
            expect(availSlot).toBeDefined();
            expect(availSlot.status).toBe('available');
        });

        it('should return 400 for invalid date query param', async () => {
            const res = await request(app)
                .get(`/api/venues/${approvedFacility.id}/availability`)
                .query({
                    courtId: activeCourt.id,
                    date: 'invalid-date-string',
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
});
