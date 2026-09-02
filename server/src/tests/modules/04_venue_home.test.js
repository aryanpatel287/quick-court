import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { createTestFacilityAndCourt } from '../helpers/auth-helper.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';

const logger = new FeatureApiDocLogger(
    '04_venue_home.md',
    'Feature 04: Public Venue Discovery & Home Feed API',
    'Public endpoints for discovering approved venues, filtering by sports/pricing/location, checking real-time slot availability, and browsing homepage feeds.',
);

jest.setTimeout(60000);

afterAll(() => {
    logger.save();
});

describe('04: Public Venue Discovery & Home Aggregations', () => {
    let testFacility;
    let testCourt;
    let testSport;

    beforeAll(async () => {
        // Seed an approved facility with court & operating hours
        const setup = await createTestFacilityAndCourt({ status: 'APPROVED' });
        testFacility = setup.facility;
        testCourt = setup.court;
        testSport = setup.sport;
    });

    describe('1. Public Venue Discovery & Filters', () => {
        it('1.1 Should list approved venues via GET /api/venues', async () => {
            const res = await request(app).get('/api/venues');

            logger.record({
                scenario: 'List All Approved Venues',
                method: 'GET',
                endpoint: '/api/venues',
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Strictly returns facilities in APPROVED status for public search.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.venues)).toBe(true);
        });

        it('1.2 Should filter venues by sport and city query params', async () => {
            const queryParams = {
                city: 'Bangalore',
                sport: testSport.name,
                page: 1,
                limit: 10,
            };

            const res = await request(app).get('/api/venues').query(queryParams);

            logger.record({
                scenario: 'Filter Venues by Sport and City',
                method: 'GET',
                endpoint: '/api/venues',
                queryParams,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Allows multi-criteria filtering for venue marketplace discovery.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.venues)).toBe(true);
        });

        it('1.3 Should filter venues by price range and venue type', async () => {
            const queryParams = {
                minPrice: 100,
                maxPrice: 1500,
                venueType: 'INDOOR',
            };

            const res = await request(app).get('/api/venues').query(queryParams);

            logger.record({
                scenario: 'Filter Venues by Price Range and Type',
                method: 'GET',
                endpoint: '/api/venues',
                queryParams,
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('1.4 Should get full venue details by ID via GET /api/venues/:venueId', async () => {
            const res = await request(app).get(`/api/venues/${testFacility.id}`);

            logger.record({
                scenario: 'Get Venue Details by ID',
                method: 'GET',
                endpoint: `/api/venues/${testFacility.id}`,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Fetches complete venue profile including sports, amenities, and photos.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.venue.id).toBe(testFacility.id);
        });

        it('1.5 Should return 404 for non-existent venue ID', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app).get(`/api/venues/${nonExistentId}`);

            logger.record({
                scenario: 'Get Venue Non-Existent ID (404)',
                method: 'GET',
                endpoint: `/api/venues/${nonExistentId}`,
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('1.6 Should get active courts for a venue via GET /api/venues/:venueId/courts', async () => {
            const res = await request(app).get(`/api/venues/${testFacility.id}/courts`);

            logger.record({
                scenario: 'Get Courts for Venue',
                method: 'GET',
                endpoint: `/api/venues/${testFacility.id}/courts`,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Lists active bookable courts within the chosen venue.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.courts)).toBe(true);
            expect(res.body.courts.length).toBeGreaterThan(0);
        });

        it('1.7 Should fetch real-time slot availability for a date via GET /api/venues/:venueId/availability', async () => {
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const day = String(tomorrow.getDate()).padStart(2, '0');
            const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
            const year = tomorrow.getFullYear();
            const dateParam = `${day}-${month}-${year}`;

            const queryParams = {
                date: dateParam,
                courtId: testCourt.id,
                slotDuration: 60,
            };

            const res = await request(app)
                .get(`/api/venues/${testFacility.id}/availability`)
                .query(queryParams);

            logger.record({
                scenario: 'Check Real-Time Court Slot Availability',
                method: 'GET',
                endpoint: `/api/venues/${testFacility.id}/availability`,
                queryParams,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Generates open booking slots factoring operating hours, maintenance blocks, and existing bookings.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('2. Home Feed & Aggregated Discovery', () => {
        it('2.1 Should fetch aggregated home feed via GET /api/home', async () => {
            const res = await request(app).get('/api/home');

            logger.record({
                scenario: 'Get Aggregated Home Feed',
                method: 'GET',
                endpoint: '/api/home',
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Unified homepage payload featuring banners, trending sports, and top venues.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });

        it('2.2 Should fetch popular venues via GET /api/home/popular-venues', async () => {
            const res = await request(app).get('/api/home/popular-venues?limit=6');

            logger.record({
                scenario: 'Get Popular Venues',
                method: 'GET',
                endpoint: '/api/home/popular-venues',
                queryParams: { limit: 6 },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.venues)).toBe(true);
        });

        it('2.3 Should fetch popular sports via GET /api/home/popular-sports', async () => {
            const res = await request(app).get('/api/home/popular-sports?limit=8');

            logger.record({
                scenario: 'Get Popular Sports Categories',
                method: 'GET',
                endpoint: '/api/home/popular-sports',
                queryParams: { limit: 8 },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.sports)).toBe(true);
        });
    });
});
