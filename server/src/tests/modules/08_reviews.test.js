import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { db } from '../../config/database.config.js';
import { bookings } from '../../db/schema/bookings.schema.js';
import { createAndLoginTestUser, createTestFacilityAndCourt } from '../helpers/auth-helper.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';

const logger = new FeatureApiDocLogger(
    '08_reviews.md',
    'Feature 08: Venue Reviews & Ratings API',
    'Public and authenticated player review operations: fetching aggregate venue ratings, creating verified reviews for completed bookings, editing commentary, and moderation deletion.',
);

jest.setTimeout(60000);

afterAll(() => {
    logger.save();
});

describe('08: Venue Reviews & Player Feedback', () => {
    let reviewerAuth;
    let otherPlayerAuth;
    let testFacility;
    let testCourt;
    let completedBooking;
    let createdReview;

    beforeAll(async () => {
        reviewerAuth = await createAndLoginTestUser({ firstName: 'Reviewer', lastName: 'Player' });
        otherPlayerAuth = await createAndLoginTestUser({ firstName: 'Other', lastName: 'Player' });

        const setup = await createTestFacilityAndCourt({ status: 'APPROVED' });
        testFacility = setup.facility;
        testCourt = setup.court;

        // Seed a COMPLETED booking in the database for the reviewer
        const pastStart = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const pastEnd = new Date(Date.now() - 47 * 60 * 60 * 1000);

        const [booking] = await db
            .insert(bookings)
            .values({
                bookingReference: `QC-REV-${Date.now()}`,
                userId: reviewerAuth.user.id,
                courtId: testCourt.id,
                startTime: pastStart,
                endTime: pastEnd,
                durationMinutes: 60,
                priceAmount: '500.00',
                priceCurrency: 'INR',
                totalAmount: '500.00',
                totalCurrency: 'INR',
                status: 'COMPLETED',
            })
            .returning();

        completedBooking = booking;
    });

    describe('1. Public Review Listing', () => {
        it('1.1 Should list venue reviews via GET /api/venues/:venueId/reviews', async () => {
            const res = await request(app).get(`/api/venues/${testFacility.id}/reviews`);

            logger.record({
                scenario: 'List Venue Reviews & Ratings Summary',
                method: 'GET',
                endpoint: `/api/venues/${testFacility.id}/reviews`,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Fetches paginated player reviews along with calculated average rating and star breakdown.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.reviews)).toBe(true);
            expect(res.body.summary).toBeDefined();
        });

        it('1.2 Should return 404 for reviews on non-existent venue', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app).get(`/api/venues/${nonExistentId}/reviews`);

            logger.record({
                scenario: 'List Reviews for Non-Existent Venue (404)',
                method: 'GET',
                endpoint: `/api/venues/${nonExistentId}/reviews`,
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('2. Review Creation & Verification Guards', () => {
        it('2.1 Anonymous request to create review should return 401 Unauthorized', async () => {
            const res = await request(app).post(`/api/venues/${testFacility.id}/reviews`).send({
                bookingId: completedBooking.id,
                rating: 5,
                comment: 'Anonymous feedback',
            });

            logger.record({
                scenario: 'Anonymous Review Creation Attempt (Rejected)',
                method: 'POST',
                endpoint: `/api/venues/${testFacility.id}/reviews`,
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('2.2 Security: Player cannot review another user booking (403)', async () => {
            const res = await request(app)
                .post(`/api/venues/${testFacility.id}/reviews`)
                .set('Cookie', otherPlayerAuth.cookie)
                .send({
                    bookingId: completedBooking.id,
                    rating: 4,
                    comment: 'Attempting to review someone else booking',
                });

            logger.record({
                scenario: 'Unverified Booking Review Attempt (Forbidden)',
                method: 'POST',
                endpoint: `/api/venues/${testFacility.id}/reviews`,
                headers: { Cookie: 'token=OTHER_PLAYER_JWT' },
                requestBody: { bookingId: completedBooking.id, rating: 4 },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Ensures only the player who actually booked the court can post a review.',
            });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('2.3 Should successfully create review for verified completed booking', async () => {
            const reviewPayload = {
                bookingId: completedBooking.id,
                rating: 5,
                comment: 'Spectacular court surface, great lighting, and pristine facilities!',
            };

            const res = await request(app)
                .post(`/api/venues/${testFacility.id}/reviews`)
                .set('Cookie', reviewerAuth.cookie)
                .send(reviewPayload);

            logger.record({
                scenario: 'Submit Verified Booking Review',
                method: 'POST',
                endpoint: `/api/venues/${testFacility.id}/reviews`,
                headers: { Cookie: 'token=REVIEWER_JWT' },
                requestBody: reviewPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Authenticates player, verifies COMPLETED booking eligibility, and saves feedback.',
            });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.review).toBeDefined();
            expect(res.body.review.rating).toBe(5);

            createdReview = res.body.review;
        });

        it('2.4 Duplicate Guard: Should reject multiple reviews for the same booking (409)', async () => {
            const res = await request(app)
                .post(`/api/venues/${testFacility.id}/reviews`)
                .set('Cookie', reviewerAuth.cookie)
                .send({
                    bookingId: completedBooking.id,
                    rating: 4,
                    comment: 'Second review attempt on same booking',
                });

            logger.record({
                scenario: 'Duplicate Review Attempt on Same Booking (Conflict 409)',
                method: 'POST',
                endpoint: `/api/venues/${testFacility.id}/reviews`,
                headers: { Cookie: 'token=REVIEWER_JWT' },
                requestBody: { bookingId: completedBooking.id, rating: 4 },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Restricts players to a single review per verified booking transaction.',
            });

            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);
        });
    });

    describe('3. Review Mutations (Update & Delete)', () => {
        it('3.1 Security: Other player cannot edit another user review (403)', async () => {
            const res = await request(app)
                .patch(`/api/reviews/${createdReview.id}`)
                .set('Cookie', otherPlayerAuth.cookie)
                .send({ rating: 1, comment: 'Unauthorized modification' });

            logger.record({
                scenario: 'Unauthorized Review Edit Attempt (Forbidden)',
                method: 'PATCH',
                endpoint: `/api/reviews/${createdReview.id}`,
                headers: { Cookie: 'token=OTHER_PLAYER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('3.2 Author should successfully update their review via PATCH /api/reviews/:reviewId', async () => {
            const updatePayload = {
                rating: 4,
                comment: 'Updated review: exceptional courts, parking could be slightly better.',
            };

            const res = await request(app)
                .patch(`/api/reviews/${createdReview.id}`)
                .set('Cookie', reviewerAuth.cookie)
                .send(updatePayload);

            logger.record({
                scenario: 'Author Updates Review',
                method: 'PATCH',
                endpoint: `/api/reviews/${createdReview.id}`,
                headers: { Cookie: 'token=REVIEWER_JWT' },
                requestBody: updatePayload,
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.review.rating).toBe(4);
        });

        it('3.3 Security: Other player cannot delete another user review (403)', async () => {
            const res = await request(app)
                .delete(`/api/reviews/${createdReview.id}`)
                .set('Cookie', otherPlayerAuth.cookie);

            logger.record({
                scenario: 'Unauthorized Review Deletion Attempt (Forbidden)',
                method: 'DELETE',
                endpoint: `/api/reviews/${createdReview.id}`,
                headers: { Cookie: 'token=OTHER_PLAYER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('3.4 Author should successfully delete their review via DELETE /api/reviews/:reviewId', async () => {
            const res = await request(app)
                .delete(`/api/reviews/${createdReview.id}`)
                .set('Cookie', reviewerAuth.cookie);

            logger.record({
                scenario: 'Author Deletes Review',
                method: 'DELETE',
                endpoint: `/api/reviews/${createdReview.id}`,
                headers: { Cookie: 'token=REVIEWER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
