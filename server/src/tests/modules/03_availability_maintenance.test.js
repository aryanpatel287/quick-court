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
    '03_availability_maintenance.md',
    'Feature 03: Court Operating Hours & Maintenance API',
    'Covers configuration of weekly operating schedules, day-by-day availability toggles, and maintenance blocking with booking collision guards.',
);

jest.setTimeout(60000);

afterAll(() => {
    logger.save();
});

describe('03: Court Operating Hours & Maintenance Blocks', () => {
    let ownerAuth;
    let otherOwnerAuth;
    let regularUserAuth;
    let testCourt;
    let testFacility;
    let scheduledBlock;

    beforeAll(async () => {
        ownerAuth = await createAndLoginTestOwner({ firstName: 'Avail', lastName: 'Owner' });
        otherOwnerAuth = await createAndLoginTestOwner({ firstName: 'Other', lastName: 'Owner' });
        regularUserAuth = await createAndLoginTestUser({ firstName: 'Player', lastName: 'User' });

        const setup = await createTestFacilityAndCourt({ ownerId: ownerAuth.user.id });
        testFacility = setup.facility;
        testCourt = setup.court;
    });

    describe('1. Court Operating Hours Configuration', () => {
        it('1.1 Should get court operating hours via GET /api/owner/courts/:courtId/availability', async () => {
            const res = await request(app)
                .get(`/api/owner/courts/${testCourt.id}/availability`)
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'Get Court Operating Hours',
                method: 'GET',
                endpoint: `/api/owner/courts/${testCourt.id}/availability`,
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Fetches configured 7-day operating schedule for the court.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.schedules)).toBe(true);
        });

        it('1.2 Should batch update weekly operating hours via POST /api/owner/courts/:courtId/availability', async () => {
            const schedulesPayload = {
                schedules: [
                    {
                        dayOfWeek: 1, // Monday
                        startTime: '06:00:00',
                        endTime: '22:00:00',
                        slotDuration: 60,
                        isClosed: false,
                    },
                    {
                        dayOfWeek: 2, // Tuesday
                        startTime: '06:00:00',
                        endTime: '22:00:00',
                        slotDuration: 60,
                        isClosed: false,
                    },
                    {
                        dayOfWeek: 3, // Wednesday
                        startTime: '07:00:00',
                        endTime: '21:00:00',
                        slotDuration: 60,
                        isClosed: false,
                    },
                ],
            };

            const res = await request(app)
                .post(`/api/owner/courts/${testCourt.id}/availability`)
                .set('Cookie', ownerAuth.cookie)
                .send(schedulesPayload);

            logger.record({
                scenario: 'Set Weekly Operating Hours Schedule',
                method: 'POST',
                endpoint: `/api/owner/courts/${testCourt.id}/availability`,
                headers: { Cookie: 'token=OWNER_JWT' },
                requestBody: schedulesPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Batch configures custom opening/closing times per day.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.schedules)).toBe(true);
        });

        it('1.3 Should update specific day operating hours via PATCH /api/owner/courts/:courtId/availability/:dayOfWeek', async () => {
            const updateDayPayload = {
                startTime: '08:00:00',
                endTime: '20:00:00',
                isClosed: false,
            };

            const res = await request(app)
                .patch(`/api/owner/courts/${testCourt.id}/availability/1`)
                .set('Cookie', ownerAuth.cookie)
                .send(updateDayPayload);

            logger.record({
                scenario: 'Update Single Day Availability Window',
                method: 'PATCH',
                endpoint: `/api/owner/courts/${testCourt.id}/availability/1`,
                headers: { Cookie: 'token=OWNER_JWT' },
                requestBody: updateDayPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.schedule.dayOfWeek).toBe(1);
        });

        it('1.4 Security: Other owner cannot alter court operating schedule (403)', async () => {
            const res = await request(app)
                .patch(`/api/owner/courts/${testCourt.id}/availability/1`)
                .set('Cookie', otherOwnerAuth.cookie)
                .send({ isClosed: true });

            logger.record({
                scenario: 'Unauthorized Schedule Modification Attempt',
                method: 'PATCH',
                endpoint: `/api/owner/courts/${testCourt.id}/availability/1`,
                headers: { Cookie: 'token=OTHER_OWNER_JWT' },
                requestBody: { isClosed: true },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    describe('2. Maintenance Block Operations', () => {
        it('2.1 Should schedule a valid maintenance block', async () => {
            // Schedule maintenance tomorrow between 10:00 and 12:00 UTC
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const startHour = new Date(tomorrow);
            startHour.setUTCHours(10, 0, 0, 0);
            const endHour = new Date(tomorrow);
            endHour.setUTCHours(12, 0, 0, 0);

            const blockPayload = {
                startTime: startHour.toISOString(),
                endTime: endHour.toISOString(),
                reason: 'Routine court surface maintenance & line repainting',
            };

            const res = await request(app)
                .post(`/api/owner/courts/${testCourt.id}/maintenance-blocks`)
                .set('Cookie', ownerAuth.cookie)
                .send(blockPayload);

            logger.record({
                scenario: 'Schedule Court Maintenance Block',
                method: 'POST',
                endpoint: `/api/owner/courts/${testCourt.id}/maintenance-blocks`,
                headers: { Cookie: 'token=OWNER_JWT' },
                requestBody: blockPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Blocks court availability preventing player bookings during maintenance.',
            });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.maintenanceBlock).toBeDefined();

            scheduledBlock = res.body.maintenanceBlock;
        });

        it('2.2 Should reject overlapping maintenance block with 409 Conflict', async () => {
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const startHour = new Date(tomorrow);
            startHour.setUTCHours(11, 0, 0, 0); // Overlaps 10:00 - 12:00
            const endHour = new Date(tomorrow);
            endHour.setUTCHours(13, 0, 0, 0);

            const conflictPayload = {
                startTime: startHour.toISOString(),
                endTime: endHour.toISOString(),
                reason: 'Conflicting secondary maintenance request',
            };

            const res = await request(app)
                .post(`/api/owner/courts/${testCourt.id}/maintenance-blocks`)
                .set('Cookie', ownerAuth.cookie)
                .send(conflictPayload);

            logger.record({
                scenario: 'Conflicting Maintenance Block Attempt (Rejected)',
                method: 'POST',
                endpoint: `/api/owner/courts/${testCourt.id}/maintenance-blocks`,
                headers: { Cookie: 'token=OWNER_JWT' },
                requestBody: conflictPayload,
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Enforces collision detection rejecting overlapping maintenance windows.',
            });

            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('2.3 Should list scheduled maintenance blocks for a court', async () => {
            const res = await request(app)
                .get(`/api/owner/courts/${testCourt.id}/maintenance-blocks`)
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'List Court Maintenance Blocks',
                method: 'GET',
                endpoint: `/api/owner/courts/${testCourt.id}/maintenance-blocks`,
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.maintenanceBlocks)).toBe(true);
            const found = res.body.maintenanceBlocks.some((b) => b.id === scheduledBlock.id);
            expect(found).toBe(true);
        });

        it('2.4 Security: Other owner cannot delete this maintenance block (403)', async () => {
            const res = await request(app)
                .delete(`/api/owner/maintenance-blocks/${scheduledBlock.id}`)
                .set('Cookie', otherOwnerAuth.cookie);

            logger.record({
                scenario: 'Cross-Owner Maintenance Block Deletion Attempt (Forbidden)',
                method: 'DELETE',
                endpoint: `/api/owner/maintenance-blocks/${scheduledBlock.id}`,
                headers: { Cookie: 'token=OTHER_OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
            });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('2.5 Should delete maintenance block and release time slot', async () => {
            const res = await request(app)
                .delete(`/api/owner/maintenance-blocks/${scheduledBlock.id}`)
                .set('Cookie', ownerAuth.cookie);

            logger.record({
                scenario: 'Delete Maintenance Block',
                method: 'DELETE',
                endpoint: `/api/owner/maintenance-blocks/${scheduledBlock.id}`,
                headers: { Cookie: 'token=OWNER_JWT' },
                statusCode: res.statusCode,
                responseBody: res.body,
                notes: 'Removes maintenance block and restores booking slot availability.',
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
