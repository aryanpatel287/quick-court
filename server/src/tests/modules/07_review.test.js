import request from 'supertest';
import app from '../../app.js';
import { db } from '../../config/database.config.js';
import { facilities } from '../../db/schema/facilities.schema.js';
import { sports } from '../../db/schema/sports.schema.js';
import { facilitySports } from '../../db/schema/facility_sports.schema.js';
import { courts } from '../../db/schema/courts.schema.js';
import { bookings } from '../../db/schema/bookings.schema.js';
import { reviews } from '../../db/schema/reviews.schema.js';
import { eq } from 'drizzle-orm';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { createAndLoginTestUser } from '../helpers/auth-helper.js';
import { generateBookingReference } from '../../utils/date.utils.js';

const docLogger = new FeatureApiDocLogger(
    '07_review_lifecycle.md',
    'Feature 07: Review Lifecycle API',
    'Covers review submissions (eligibility checks), retrieval, editing, and author/admin deletion.',
);

describe('07: Review Lifecycle API', () => {
    let authorUserAuth;
    let otherUserAuth;
    let adminUserAuth;
    let ownerAuth;
    let testFacility;
    let testCourt;
    let completedBooking;
    let confirmedBooking;
    let otherUserCompletedBooking;

    beforeAll(async () => {
        authorUserAuth = await createAndLoginTestUser({ role: 'USER' });
        otherUserAuth = await createAndLoginTestUser({ role: 'USER' });
        adminUserAuth = await createAndLoginTestUser({ role: 'ADMIN' });
        ownerAuth = await createAndLoginTestUser({ role: 'FACILITY_OWNER' });

        // Ensure sport exists
        const [sport] = await db
            .insert(sports)
            .values({
                name: `Squash_${Date.now()}`,
                slug: `squash-${Date.now()}`,
                isActive: true,
            })
            .returning();

        // Create approved facility
        const [fac] = await db
            .insert(facilities)
            .values({
                ownerId: ownerAuth.user.id,
                name: 'Elite Squash Club',
                addressLine: '100 Squash Way',
                city: 'Delhi',
                state: 'Delhi',
                venueType: 'INDOOR',
                status: 'APPROVED',
            })
            .returning();
        testFacility = fac;

        await db.insert(facilitySports).values({
            facilityId: testFacility.id,
            sportId: sport.id,
        });

        // Create court
        const [court] = await db
            .insert(courts)
            .values({
                facilityId: testFacility.id,
                sportId: sport.id,
                name: 'Court 1',
                priceAmount: '350.00',
                priceCurrency: 'INR',
                isActive: true,
            })
            .returning();
        testCourt = court;

        // 1. Author's COMPLETED booking
        const pastStart = new Date();
        pastStart.setDate(pastStart.getDate() - 3);
        const pastEnd = new Date(pastStart);
        pastEnd.setHours(pastStart.getHours() + 1);

        const [compBk] = await db
            .insert(bookings)
            .values({
                bookingReference: generateBookingReference(
                    Math.floor(Math.random() * 900000) + 100000,
                    pastStart,
                ),
                userId: authorUserAuth.user.id,
                courtId: testCourt.id,
                startTime: pastStart,
                endTime: pastEnd,
                durationMinutes: 60,
                priceAmount: '350.00',
                priceCurrency: 'INR',
                totalAmount: '350.00',
                totalCurrency: 'INR',
                status: 'COMPLETED',
            })
            .returning();
        completedBooking = compBk;

        // 2. Author's CONFIRMED (not completed) booking
        const futureStart = new Date();
        futureStart.setDate(futureStart.getDate() + 5);
        const futureEnd = new Date(futureStart);
        futureEnd.setHours(futureStart.getHours() + 1);

        const [confBk] = await db
            .insert(bookings)
            .values({
                bookingReference: generateBookingReference(
                    Math.floor(Math.random() * 900000) + 100000,
                    futureStart,
                ),
                userId: authorUserAuth.user.id,
                courtId: testCourt.id,
                startTime: futureStart,
                endTime: futureEnd,
                durationMinutes: 60,
                priceAmount: '350.00',
                priceCurrency: 'INR',
                totalAmount: '350.00',
                totalCurrency: 'INR',
                status: 'CONFIRMED',
            })
            .returning();
        confirmedBooking = confBk;

        // 3. Other user's completed booking
        const [otherBk] = await db
            .insert(bookings)
            .values({
                bookingReference: generateBookingReference(
                    Math.floor(Math.random() * 900000) + 100000,
                    pastStart,
                ),
                userId: otherUserAuth.user.id,
                courtId: testCourt.id,
                startTime: pastStart,
                endTime: pastEnd,
                durationMinutes: 60,
                priceAmount: '350.00',
                priceCurrency: 'INR',
                totalAmount: '350.00',
                totalCurrency: 'INR',
                status: 'COMPLETED',
            })
            .returning();
        otherUserCompletedBooking = otherBk;
    });

    afterAll(() => {
        docLogger.save();
    });

    describe('POST /api/venues/:venueId/reviews', () => {
        it('should reject review submission for uncompleted booking (400 Bad Request)', async () => {
            const payload = {
                bookingId: confirmedBooking.id,
                rating: 5,
                comment: 'Great court!',
            };

            const res = await request(app)
                .post(`/api/venues/${testFacility.id}/reviews`)
                .set('Cookie', authorUserAuth.cookie)
                .send(payload);

            docLogger.record({
                scenario: 'Create Review — Reject Non-Completed Booking',
                method: 'POST',
                endpoint: `/api/venues/${testFacility.id}/reviews`,
                headers: { Cookie: '[USER Token]' },
                requestBody: payload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Only COMPLETED bookings can be reviewed.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should reject review submission for another user's booking (403 Forbidden)", async () => {
            const payload = {
                bookingId: otherUserCompletedBooking.id,
                rating: 5,
                comment: 'Trying to review someone elses booking',
            };

            const res = await request(app)
                .post(`/api/venues/${testFacility.id}/reviews`)
                .set('Cookie', authorUserAuth.cookie)
                .send(payload);

            docLogger.record({
                scenario: 'Create Review — Reject Other User Booking',
                method: 'POST',
                endpoint: `/api/venues/${testFacility.id}/reviews`,
                headers: { Cookie: '[USER Token]' },
                requestBody: payload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Users cannot review bookings they did not make.',
            });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should successfully create review for completed booking (201 Created)', async () => {
            const payload = {
                bookingId: completedBooking.id,
                rating: 5,
                comment: 'Excellent court quality and lighting!',
            };

            const res = await request(app)
                .post(`/api/venues/${testFacility.id}/reviews`)
                .set('Cookie', authorUserAuth.cookie)
                .send(payload);

            docLogger.record({
                scenario: 'Create Review — Success (201 Created)',
                method: 'POST',
                endpoint: `/api/venues/${testFacility.id}/reviews`,
                headers: { Cookie: '[USER Token]' },
                requestBody: payload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Creates review after verifying completed booking and user ownership.',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.review).toBeDefined();
            expect(res.body.review.rating).toBe(5);
        });

        it('should prevent duplicate reviews for the same booking (409 Conflict)', async () => {
            const payload = {
                bookingId: completedBooking.id,
                rating: 4,
                comment: 'Duplicate attempt',
            };

            const res = await request(app)
                .post(`/api/venues/${testFacility.id}/reviews`)
                .set('Cookie', authorUserAuth.cookie)
                .send(payload);

            docLogger.record({
                scenario: 'Create Review — Duplicate Conflict (409)',
                method: 'POST',
                endpoint: `/api/venues/${testFacility.id}/reviews`,
                headers: { Cookie: '[USER Token]' },
                requestBody: payload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Enforces unique review constraint per (userId, bookingId).',
            });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/venues/:venueId/reviews', () => {
        it('should list public reviews for venue with summary stats (200 OK)', async () => {
            const res = await request(app).get(`/api/venues/${testFacility.id}/reviews`);

            docLogger.record({
                scenario: 'Get Public Reviews for Venue',
                method: 'GET',
                endpoint: `/api/venues/${testFacility.id}/reviews`,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns reviews array, rating summary, and distribution breakdown.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.reviews)).toBe(true);
            expect(res.body.summary).toBeDefined();
            expect(res.body.summary.ratingDistribution).toBeDefined();
            expect(res.body.pagination).toBeDefined();
        });
    });

    describe('PATCH /api/reviews/:reviewId', () => {
        let testReview;

        beforeAll(async () => {
            const [rev] = await db
                .select()
                .from(reviews)
                .where(eq(reviews.userId, authorUserAuth.user.id))
                .limit(1);
            testReview = rev;
        });

        it('should prevent editing another users review (403 Forbidden)', async () => {
            const res = await request(app)
                .patch(`/api/reviews/${testReview.id}`)
                .set('Cookie', otherUserAuth.cookie)
                .send({ rating: 2 });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should update review by author (200 OK)', async () => {
            const payload = {
                rating: 4,
                comment: 'Updated review comment after another visit.',
            };

            const res = await request(app)
                .patch(`/api/reviews/${testReview.id}`)
                .set('Cookie', authorUserAuth.cookie)
                .send(payload);

            docLogger.record({
                scenario: 'Update Review (Author)',
                method: 'PATCH',
                endpoint: `/api/reviews/${testReview.id}`,
                headers: { Cookie: '[Author USER Token]' },
                requestBody: payload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Allows the original author to update rating and comment.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.review.rating).toBe(4);
            expect(res.body.review.comment).toBe(payload.comment);
        });
    });

    describe('DELETE /api/reviews/:reviewId', () => {
        let reviewToDelete;

        beforeEach(async () => {
            // Create a fresh review to delete
            // Create completed booking for other user
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 10);
            const [bk] = await db
                .insert(bookings)
                .values({
                    bookingReference: generateBookingReference(
                        Math.floor(Math.random() * 800000) + 100000,
                        pastDate,
                    ),
                    userId: otherUserAuth.user.id,
                    courtId: testCourt.id,
                    startTime: pastDate,
                    endTime: new Date(pastDate.getTime() + 3600000),
                    durationMinutes: 60,
                    priceAmount: '350.00',
                    priceCurrency: 'INR',
                    totalAmount: '350.00',
                    totalCurrency: 'INR',
                    status: 'COMPLETED',
                })
                .returning();

            const [rev] = await db
                .insert(reviews)
                .values({
                    facilityId: testFacility.id,
                    userId: otherUserAuth.user.id,
                    bookingId: bk.id,
                    rating: 3,
                    comment: 'Decent squash court',
                })
                .returning();
            reviewToDelete = rev;
        });

        it('should reject delete by unauthorized user (403 Forbidden)', async () => {
            const res = await request(app)
                .delete(`/api/reviews/${reviewToDelete.id}`)
                .set('Cookie', authorUserAuth.cookie); // authorUser is not the review author or admin

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should allow ADMIN to delete review (200 OK)', async () => {
            const res = await request(app)
                .delete(`/api/reviews/${reviewToDelete.id}`)
                .set('Cookie', adminUserAuth.cookie);

            docLogger.record({
                scenario: 'Delete Review (Admin Moderation)',
                method: 'DELETE',
                endpoint: `/api/reviews/${reviewToDelete.id}`,
                headers: { Cookie: '[ADMIN Token]' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Allows ADMIN role to delete/moderate any review.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should allow review author to delete own review (200 OK)', async () => {
            const res = await request(app)
                .delete(`/api/reviews/${reviewToDelete.id}`)
                .set('Cookie', otherUserAuth.cookie); // otherUser is the author

            docLogger.record({
                scenario: 'Delete Review (Author)',
                method: 'DELETE',
                endpoint: `/api/reviews/${reviewToDelete.id}`,
                headers: { Cookie: '[Author Token]' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Allows review author to delete their own review.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
