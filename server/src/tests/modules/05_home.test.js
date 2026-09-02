import request from 'supertest';
import app from '../../app.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';

const docLogger = new FeatureApiDocLogger(
    '05_home_feed.md',
    'Feature 05: Public Home Page Feed & Popular Aggregations API',
    'Aggregates featured sports venues, popular sports, and platform KPI stats for landing screens.',
);

describe('05: Home Feed & Popular Aggregations API', () => {
    afterAll(() => {
        docLogger.save();
    });

    describe('GET /api/home', () => {
        it('should retrieve aggregated home feed (200 OK)', async () => {
            const res = await request(app).get('/api/home');

            docLogger.record({
                scenario: 'Retrieve Home Aggregated Feed (Public)',
                method: 'GET',
                endpoint: '/api/home',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns combined feed with popular venues, popular sports, and platform stats.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(Array.isArray(res.body.data.popularVenues)).toBe(true);
            expect(Array.isArray(res.body.data.popularSports)).toBe(true);
            expect(res.body.data.stats).toBeDefined();
            expect(typeof res.body.data.stats.totalVenues).toBe('number');
            expect(typeof res.body.data.stats.totalSports).toBe('number');
        });
    });

    describe('GET /api/home/popular-venues', () => {
        it('should retrieve list of popular venues (200 OK)', async () => {
            const res = await request(app).get('/api/home/popular-venues').query({ limit: 4 });

            docLogger.record({
                scenario: 'Retrieve Popular Venues',
                method: 'GET',
                endpoint: '/api/home/popular-venues',
                queryParams: { limit: 4 },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns top venues sorted by ratings and booking counts.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.venues)).toBe(true);
        });
    });

    describe('GET /api/home/popular-sports', () => {
        it('should retrieve list of popular sports (200 OK)', async () => {
            const res = await request(app).get('/api/home/popular-sports').query({ limit: 5 });

            docLogger.record({
                scenario: 'Retrieve Popular Sports',
                method: 'GET',
                endpoint: '/api/home/popular-sports',
                queryParams: { limit: 5 },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns top sports sorted by active venue availability.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.sports)).toBe(true);
        });
    });
});
