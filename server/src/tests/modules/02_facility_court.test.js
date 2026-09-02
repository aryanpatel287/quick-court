import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { db } from '../../config/database.config.js';
import { sports } from '../../db/schema/sports.schema.js';
import { facilities } from '../../db/schema/facilities.schema.js';
import { courts } from '../../db/schema/courts.schema.js';
import { facilityPhotos } from '../../db/schema/facility_photos.schema.js';
import { createAndLoginTestUser, createAndLoginTestOwner } from '../helpers/auth-helper.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { eq } from 'drizzle-orm';

const logger = new FeatureApiDocLogger(
    '02_facility_court.md',
    'Feature 02: Facility & Court Supply Management API',
    'Comprehensive API test suite for facility registration, profile management, photo galleries, and court CRUD operations by facility owners.',
);

jest.setTimeout(60000);

afterAll(() => {
    logger.save();
});

describe('02: Facility & Court Supply Management', () => {
    let ownerAuth;
    let otherOwnerAuth;
    let regularUserAuth;
    let defaultSport;
    let createdFacility;
    let createdCourt;
    let testPhotoRecord;

    beforeAll(async () => {
        ownerAuth = await createAndLoginTestOwner({ firstName: 'Facility', lastName: 'Owner1' });
        otherOwnerAuth = await createAndLoginTestOwner({ firstName: 'Other', lastName: 'Owner2' });
        regularUserAuth = await createAndLoginTestUser({ firstName: 'Normal', lastName: 'Player' });

        // Retrieve or seed a sport
        let [sport] = await db.select().from(sports).limit(1);
        if (!sport) {
            [sport] = await db
                .insert(sports)
                .values({
                    name: 'Tennis',
                    iconUrl: 'https://placehold.co/100x100.png',
                })
                .returning();
        }
        defaultSport = sport;
    });

    describe('1. Facility RBAC & Security', () => {
        it('1.1 Anonymous request to /api/owner/facilities should return 401 Unauthorized', async () => {
            const res = await request(app).get('/api/owner/facilities');

            logger.record({
                scenario: 'Anonymous Access to Owner Facilities (Rejected)',
                method: 'GET',
                endpoint: '/api/owner/facilities',
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Guards all owner routes against unauthenticated requests.',
            });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('1.2 Regular USER request to /api/owner/facilities should return 403 Forbidden', async () => {
            const res = await request(app)
                .get('/api/owner/facilities')
                .set('Cookie', regularUserAuth.cookie);

            logger.record({
                scenario: 'Regular User Access to Owner Facilities (Forbidden)',
                method: 'GET',
                endpoint: '/api/owner/facilities',
                headers: { Cookie: 'token=USER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Ensures strict RBAC restricting facility management to FACILITY_OWNER role.',
            });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    describe('2. Facility Lifecycle & Management', () => {
        it('2.1 Should create a new facility with status PENDING', async () => {
            const timestamp = Date.now();
            const facilityPayload = {
                name: `Apex Sports Arena ${timestamp}`,
                description: 'State of the art multisport complex with indoor courts.',
                addressLine: '456 Stadium Road',
                city: 'Bangalore',
                state: 'Karnataka',
                postalCode: '560001',
                venueType: 'INDOOR',
                sportIds: [defaultSport.id],
            };

            const res = await request(app)
                .post('/api/owner/facilities')
                .set('Cookie', ownerAuth.cookie)
                .send(facilityPayload);

            logger.record({
                scenario: 'Create New Facility (Pending Approval)',
                method: 'POST',
                endpoint: '/api/owner/facilities',
                headers: { Cookie: 'token=OWNER_JWT' },
                requestBody: facilityPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Newly registered facilities default to PENDING status awaiting admin review.',
            });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            const facility = res.body.facility || res.body.data;
            expect(facility).toBeDefined();
            expect(facility.name).toBe(facilityPayload.name);
            expect(facility.status).toBe('PENDING');

            createdFacility = facility;
        });

        it('2.2 Should list all facilities owned by current owner', async () => {
            const res = await request(app)
                .get('/api/owner/facilities')
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'List Owner Facilities',
                method: 'GET',
                endpoint: '/api/owner/facilities',
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Returns only facilities matching the authenticated ownerId.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            const facilitiesList = res.body.facilities || res.body.data || [];
            expect(Array.isArray(facilitiesList)).toBe(true);
            const found = facilitiesList.some((f) => f.id === createdFacility.id);
            expect(found).toBe(true);
        });

        it('2.3 Should get specific facility details by ID', async () => {
            const res = await request(app)
                .get(`/api/owner/facilities/${createdFacility.id}`)
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'Get Facility Details by ID',
                method: 'GET',
                endpoint: `/api/owner/facilities/${createdFacility.id}`,
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            const facility = res.body.facility || res.body.data;
            expect(facility.id).toBe(createdFacility.id);
        });

        it('2.4 Should update facility details via PATCH', async () => {
            const updatePayload = {
                description: 'Updated description: Premier indoor arena with synthetic turf.',
                addressLine: '456 Stadium Road, Sector 4',
            };

            const res = await request(app)
                .patch(`/api/owner/facilities/${createdFacility.id}`)
                .set('Cookie', ownerAuth.cookie)
                .send(updatePayload);

            logger.record({
                scenario: 'Update Facility Details',
                method: 'PATCH',
                endpoint: `/api/owner/facilities/${createdFacility.id}`,
                headers: { Cookie: 'token=OWNER_JWT' },
                requestBody: updatePayload,
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('2.5 Security: Other owner cannot update this facility (403)', async () => {
            const res = await request(app)
                .patch(`/api/owner/facilities/${createdFacility.id}`)
                .set('Cookie', otherOwnerAuth.cookie)
                .send({ name: 'Hacked Facility Name' });

            logger.record({
                scenario: 'Unauthorized Owner Mutation Attempt (Rejected)',
                method: 'PATCH',
                endpoint: `/api/owner/facilities/${createdFacility.id}`,
                headers: { Cookie: 'token=OTHER_OWNER_JWT' },
                requestBody: { name: 'Hacked Facility Name' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Enforces strict resource tenancy preventing cross-owner data tampering.',
            });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    describe('3. Facility Photos Management', () => {
        beforeAll(async () => {
            if (createdFacility) {
                const [photo] = await db
                    .insert(facilityPhotos)
                    .values({
                        facilityId: createdFacility.id,
                        imageUrl: 'https://placehold.co/600x400.png',
                        imageKey: 'test-photo-key-1',
                        isPrimary: false,
                        displayOrder: 0,
                    })
                    .returning();
                testPhotoRecord = photo;
            }
        });

        it('3.1 Should reject photo upload if no files are provided (400)', async () => {
            const res = await request(app)
                .post(`/api/owner/facilities/${createdFacility.id}/photos`)
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'Photo Upload Missing Files (Validation)',
                method: 'POST',
                endpoint: `/api/owner/facilities/${createdFacility.id}/photos`,
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('3.2 Should set photo as primary via PATCH /:facilityId/photos/:photoId/primary', async () => {
            const res = await request(app)
                .patch(
                    `/api/owner/facilities/${createdFacility.id}/photos/${testPhotoRecord.id}/primary`,
                )
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'Set Primary Facility Photo',
                method: 'PATCH',
                endpoint: `/api/owner/facilities/${createdFacility.id}/photos/${testPhotoRecord.id}/primary`,
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('3.3 Should delete facility photo via DELETE /:facilityId/photos/:photoId', async () => {
            const res = await request(app)
                .delete(`/api/owner/facilities/${createdFacility.id}/photos/${testPhotoRecord.id}`)
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'Delete Facility Photo',
                method: 'DELETE',
                endpoint: `/api/owner/facilities/${createdFacility.id}/photos/${testPhotoRecord.id}`,
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('4. Court Management (Supply Creation & Mutations)', () => {
        it('4.1 Should create a new court inside owner facility', async () => {
            const courtPayload = {
                name: 'Court 1 - Synthetic Pro',
                sportId: defaultSport.id,
                priceAmount: 650,
                priceCurrency: 'INR',
            };

            const res = await request(app)
                .post(`/api/owner/facilities/${createdFacility.id}/courts`)
                .set('Cookie', ownerAuth.cookie)
                .send(courtPayload);

            logger.record({
                scenario: 'Create Court in Facility',
                method: 'POST',
                endpoint: `/api/owner/facilities/${createdFacility.id}/courts`,
                headers: { Cookie: 'token=OWNER_JWT' },
                requestBody: courtPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Configures sport type and pricing for the court.',
            });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            const court = res.body.court || res.body.data;
            expect(court).toBeDefined();
            expect(court.name).toBe(courtPayload.name);
            expect(Number(court.pricePerHour || court.priceAmount)).toBe(650);

            createdCourt = court;
        });

        it('4.2 Should reject court creation with negative price (400)', async () => {
            const invalidPayload = {
                name: 'Invalid Court',
                sportId: defaultSport.id,
                priceAmount: -100,
            };

            const res = await request(app)
                .post(`/api/owner/facilities/${createdFacility.id}/courts`)
                .set('Cookie', ownerAuth.cookie)
                .send(invalidPayload);

            logger.record({
                scenario: 'Create Court with Invalid Price (Validation)',
                method: 'POST',
                endpoint: `/api/owner/facilities/${createdFacility.id}/courts`,
                headers: { Cookie: 'token=OWNER_JWT' },
                requestBody: invalidPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('4.3 Should list all courts within a facility', async () => {
            const res = await request(app)
                .get(`/api/owner/facilities/${createdFacility.id}/courts`)
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'List Facility Courts',
                method: 'GET',
                endpoint: `/api/owner/facilities/${createdFacility.id}/courts`,
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            const courtsList = res.body.courts || res.body.data || [];
            expect(Array.isArray(courtsList)).toBe(true);
            const found = courtsList.some((c) => c.id === createdCourt.id);
            expect(found).toBe(true);
        });

        it('4.4 Should get details for a specific court via GET /api/owner/courts/:courtId', async () => {
            const res = await request(app)
                .get(`/api/owner/courts/${createdCourt.id}`)
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'Get Court Details by ID',
                method: 'GET',
                endpoint: `/api/owner/courts/${createdCourt.id}`,
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            const court = res.body.court || res.body.data;
            expect(court.id).toBe(createdCourt.id);
        });

        it('4.5 Should update court pricing and details via PATCH /api/owner/courts/:courtId', async () => {
            const updatePayload = {
                name: 'Court 1 - Premium Synthetic',
                priceAmount: 700,
            };

            const res = await request(app)
                .patch(`/api/owner/courts/${createdCourt.id}`)
                .set('Cookie', ownerAuth.cookie)
                .send(updatePayload);

            logger.record({
                scenario: 'Update Court Details',
                method: 'PATCH',
                endpoint: `/api/owner/courts/${createdCourt.id}`,
                headers: { Cookie: 'token=OWNER_JWT' },
                requestBody: updatePayload,
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            const court = res.body.court || res.body.data;
            expect(Number(court.pricePerHour || court.priceAmount)).toBe(700);
        });

        it('4.6 Security: Other owner cannot delete or mutate this court (403)', async () => {
            const res = await request(app)
                .delete(`/api/owner/courts/${createdCourt.id}`)
                .set('Cookie', otherOwnerAuth.cookie);

            logger.record({
                scenario: 'Cross-Owner Court Deletion Attempt (Rejected)',
                method: 'DELETE',
                endpoint: `/api/owner/courts/${createdCourt.id}`,
                headers: { Cookie: 'token=OTHER_OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Prevents unauthorized owners from modifying or deleting courts.',
            });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('4.7 Should delete / deactivate court via DELETE /api/owner/courts/:courtId', async () => {
            const res = await request(app)
                .delete(`/api/owner/courts/${createdCourt.id}`)
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'Deactivate / Delete Court',
                method: 'DELETE',
                endpoint: `/api/owner/courts/${createdCourt.id}`,
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('5. Facility Soft Deletion', () => {
        it('5.1 Should soft delete facility via DELETE /api/owner/facilities/:facilityId', async () => {
            const res = await request(app)
                .delete(`/api/owner/facilities/${createdFacility.id}`)
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'Soft Delete Facility',
                method: 'DELETE',
                endpoint: `/api/owner/facilities/${createdFacility.id}`,
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Soft-deletes the facility and cascades deactivation to child courts.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify facility status in database
            const [dbFacility] = await db
                .select()
                .from(facilities)
                .where(eq(facilities.id, createdFacility.id));
            expect(dbFacility.deletedAt).toBeDefined();
            expect(dbFacility.deletedAt).not.toBeNull();
        });
    });
});
