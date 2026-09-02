import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { db } from '../../config/database.config.js';
import { users } from '../../db/schema/users.schema.js';
import { facilities } from '../../db/schema/facilities.schema.js';
import { facilityStatusHistory } from '../../db/schema/facility_status_history.schema.js';
import { courts } from '../../db/schema/courts.schema.js';
import { sports } from '../../db/schema/sports.schema.js';
import { bookings } from '../../db/schema/bookings.schema.js';
import { payments } from '../../db/schema/payments.schema.js';
import redis from '../../config/cache.config.js';
import { createAndLoginTestUser, generateTestUserData } from '../helpers/auth-helper.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { eq } from 'drizzle-orm';

const logger = new FeatureApiDocLogger(
    '01_auth_user.md',
    'Feature 01: Identity, Authentication & Platform Administration',
    'Comprehensive API test suite and documentation for user/owner registration, OTP verification, authentication, user profiles, admin facility approval/rejection, admin user management, and admin dashboard analytics.',
);

jest.setTimeout(60000);

afterAll(() => {
    logger.save();
});

describe('1. Registration Flow (User & Facility Owner)', () => {
    it('1.1 Should register a USER successfully and force role = USER', async () => {
        const userData = generateTestUserData('reg_user');
        const res = await request(app).post('/api/auth/register/user').send({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password,
        });

        logger.record({
            scenario: 'User Registration (Forced USER role)',
            method: 'POST',
            endpoint: '/api/auth/register/user',
            requestBody: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: '***',
            },
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.role).toBe('USER');
        expect(res.body.data.user.emailVerified).toBe(false);

        // Verify database record
        const [dbUser] = await db.select().from(users).where(eq(users.email, userData.email));
        expect(dbUser).toBeDefined();
        expect(dbUser.role).toBe('USER');
        expect(dbUser.emailVerified).toBe(false);
    });

    it('1.2 Security: Should ignore or reject client attempt to inject admin role in user registration', async () => {
        const userData = generateTestUserData('tamper_user');
        const res = await request(app).post('/api/auth/register/user').send({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password,
            role: 'ADMIN',
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.user.role).toBe('USER');

        const [dbUser] = await db.select().from(users).where(eq(users.email, userData.email));
        expect(dbUser.role).toBe('USER');
    });

    it('1.3 Should register a FACILITY_OWNER successfully and force role = FACILITY_OWNER', async () => {
        const ownerData = generateTestUserData('reg_owner');
        const res = await request(app).post('/api/auth/register/facility-owner').send({
            firstName: ownerData.firstName,
            lastName: ownerData.lastName,
            email: ownerData.email,
            password: ownerData.password,
        });

        logger.record({
            scenario: 'Facility Owner Registration (Forced FACILITY_OWNER role)',
            method: 'POST',
            endpoint: '/api/auth/register/facility-owner',
            requestBody: {
                firstName: ownerData.firstName,
                lastName: ownerData.lastName,
                email: ownerData.email,
                password: '***',
            },
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.role).toBe('FACILITY_OWNER');
        expect(res.body.data.user.emailVerified).toBe(false);

        const [dbOwner] = await db.select().from(users).where(eq(users.email, ownerData.email));
        expect(dbOwner).toBeDefined();
        expect(dbOwner.role).toBe('FACILITY_OWNER');
    });

    it('1.4 Should reject duplicate email registration', async () => {
        const { user } = await createAndLoginTestUser({ prefix: 'dup_user' });
        const res = await request(app).post('/api/auth/register/user').send({
            firstName: 'Duplicate',
            lastName: 'User',
            email: user.email,
            password: 'Password@123',
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

describe('2. OTP Verification & Resend Flow', () => {
    it('2.1 Should resend verification OTP', async () => {
        const userData = generateTestUserData('resend_otp_user');
        await request(app).post('/api/auth/register/user').send(userData);

        // Reset cooldown in session without deleting the active OTP
        try {
            const otpKey = `verify:${userData.email}`;
            const raw = await redis.get(otpKey);
            if (raw) {
                const session = JSON.parse(raw);
                session.cooldownExpiresAt = 0;
                await redis.set(otpKey, JSON.stringify(session), 'EX', 600);
            }
        } catch (e) {
            // ignore
        }

        const res = await request(app).post('/api/auth/resend-otp').send({ email: userData.email });

        logger.record({
            scenario: 'Resend Verification OTP',
            method: 'POST',
            endpoint: '/api/auth/resend-otp',
            requestBody: { email: userData.email },
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('2.2 Should reject invalid OTP', async () => {
        const userData = generateTestUserData('bad_otp_user');
        await request(app).post('/api/auth/register/user').send(userData);

        const res = await request(app).post('/api/auth/verify-otp').send({
            email: userData.email,
            otp: '000000',
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

describe('3. Login, Session & RBAC', () => {
    it('3.1 Should reject login for unverified account', async () => {
        const userData = generateTestUserData('unverified_user');
        await request(app).post('/api/auth/register/user').send(userData);

        const res = await request(app).post('/api/auth/login').send({
            email: userData.email,
            password: userData.password,
        });

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/verify your email/i);
    });

    it('3.2 Should successfully login a verified USER and set auth cookie', async () => {
        const rawPassword = 'StrongPassword123!';
        const { user } = await createAndLoginTestUser({
            role: 'USER',
            password: rawPassword,
            emailVerified: true,
            isActive: true,
        });

        const res = await request(app).post('/api/auth/login').send({
            email: user.email,
            password: rawPassword,
        });

        logger.record({
            scenario: 'User Login with Verified Account',
            method: 'POST',
            endpoint: '/api/auth/login',
            requestBody: { email: user.email, password: '***' },
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.headers['set-cookie']).toBeDefined();
    });

    it('3.3 Should reject login for banned/deactivated account', async () => {
        const rawPassword = 'Password@123';
        const { user } = await createAndLoginTestUser({
            role: 'USER',
            password: rawPassword,
            isActive: false,
            emailVerified: true,
        });

        const res = await request(app).post('/api/auth/login').send({
            email: user.email,
            password: rawPassword,
        });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch(/deactivated or banned/i);
    });

    it('3.4 Should successfully logout and clear session', async () => {
        const { cookie } = await createAndLoginTestUser();

        const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);

        logger.record({
            scenario: 'User Logout',
            method: 'POST',
            endpoint: '/api/auth/logout',
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('4. User Profile Management', () => {
    it('4.1 Should fetch authenticated user profile via GET /api/auth/me and /api/users/me', async () => {
        const { user, cookie } = await createAndLoginTestUser({ role: 'USER' });

        const authMeRes = await request(app).get('/api/auth/me').set('Cookie', cookie);
        expect(authMeRes.statusCode).toBe(200);
        expect(authMeRes.body.data.user.email).toBe(user.email);

        const usersMeRes = await request(app).get('/api/users/me').set('Cookie', cookie);
        logger.record({
            scenario: 'Get Current User Profile (/api/users/me)',
            method: 'GET',
            endpoint: '/api/users/me',
            statusCode: usersMeRes.statusCode,
            responseBody: usersMeRes.body,
        });

        expect(usersMeRes.statusCode).toBe(200);
        expect(usersMeRes.body.data.user.email).toBe(user.email);
    });

    it('4.2 Should update profile details via PATCH /api/users/me', async () => {
        const { cookie } = await createAndLoginTestUser({ role: 'USER' });

        const res = await request(app).patch('/api/users/me').set('Cookie', cookie).send({
            firstName: 'UpdatedFirst',
            lastName: 'UpdatedLast',
        });

        logger.record({
            scenario: 'Update User Profile Details',
            method: 'PATCH',
            endpoint: '/api/users/me',
            requestBody: { firstName: 'UpdatedFirst', lastName: 'UpdatedLast' },
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.user.firstName).toBe('UpdatedFirst');
        expect(res.body.data.user.lastName).toBe('UpdatedLast');
    });

    it('4.3 Should soft delete account via DELETE /api/users/me', async () => {
        const { user, cookie } = await createAndLoginTestUser({ role: 'USER' });

        const res = await request(app)
            .delete('/api/users/me')
            .set('Cookie', cookie)
            .send({ password: 'Password@123' });

        logger.record({
            scenario: 'User Soft Delete Account',
            method: 'DELETE',
            endpoint: '/api/users/me',
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);

        const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
        expect(dbUser.isDeleted).toBe(true);
        expect(dbUser.isActive).toBe(false);
    });
});

describe('5. Admin RBAC & Protection', () => {
    it('5.1 Anonymous request to /api/admin/facilities returns 401', async () => {
        const res = await request(app).get('/api/admin/facilities');
        expect(res.statusCode).toBe(401);
    });

    it('5.2 Regular USER request to /api/admin/facilities returns 403', async () => {
        const { cookie } = await createAndLoginTestUser({ role: 'USER' });
        const res = await request(app).get('/api/admin/facilities').set('Cookie', cookie);
        expect(res.statusCode).toBe(403);
    });

    it('5.3 FACILITY_OWNER request to /api/admin/facilities returns 403', async () => {
        const { cookie } = await createAndLoginTestUser({ role: 'FACILITY_OWNER' });
        const res = await request(app).get('/api/admin/facilities').set('Cookie', cookie);
        expect(res.statusCode).toBe(403);
    });

    it('5.4 ADMIN request to /api/admin/facilities succeeds (200)', async () => {
        const { cookie } = await createAndLoginTestUser({ role: 'ADMIN' });
        const res = await request(app).get('/api/admin/facilities').set('Cookie', cookie);
        expect(res.statusCode).toBe(200);
    });
});

describe('6. Admin Facility Approval / Rejection Workflow', () => {
    let adminCookie;
    let owner;
    let pendingFacility;

    beforeAll(async () => {
        const adminAuth = await createAndLoginTestUser({ role: 'ADMIN' });
        adminCookie = adminAuth.cookie;

        const ownerAuth = await createAndLoginTestUser({ role: 'FACILITY_OWNER' });
        owner = ownerAuth.user;

        // Insert a test pending facility
        const [facility] = await db
            .insert(facilities)
            .values({
                ownerId: owner.id,
                name: 'Apex Arena Hub',
                description: 'Premier sports facility with 6 badminton courts',
                addressLine: '123 Stadium Road',
                city: 'Bengaluru',
                state: 'Karnataka',
                postalCode: '560001',
                venueType: 'INDOOR',
                status: 'PENDING',
            })
            .returning();
        pendingFacility = facility;
    });

    it('6.1 Should list pending facilities via GET /api/admin/facilities/pending', async () => {
        const res = await request(app)
            .get('/api/admin/facilities/pending')
            .set('Cookie', adminCookie);

        logger.record({
            scenario: 'List Pending Facilities for Review',
            method: 'GET',
            endpoint: '/api/admin/facilities/pending',
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.facilities)).toBe(true);
        expect(res.body.data.facilities.some((f) => f.id === pendingFacility.id)).toBe(true);
    });

    it('6.2 Should get facility details by ID via GET /api/admin/facilities/:facilityId', async () => {
        const res = await request(app)
            .get(`/api/admin/facilities/${pendingFacility.id}`)
            .set('Cookie', adminCookie);

        logger.record({
            scenario: 'Get Detailed Facility Information by ID',
            method: 'GET',
            endpoint: `/api/admin/facilities/${pendingFacility.id}`,
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.facility.name).toBe('Apex Arena Hub');
        expect(res.body.data.facility.owner.email).toBe(owner.email);
    });

    it('6.3 Should approve facility and create history record inside a transaction', async () => {
        const res = await request(app)
            .patch(`/api/admin/facilities/${pendingFacility.id}/approve`)
            .set('Cookie', adminCookie)
            .send({ comment: 'All documentation verified. Approved.' });

        logger.record({
            scenario: 'Admin Approve Facility',
            method: 'PATCH',
            endpoint: `/api/admin/facilities/${pendingFacility.id}/approve`,
            requestBody: { comment: 'All documentation verified. Approved.' },
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.facility.status).toBe('APPROVED');

        // Verify in database: facility is APPROVED and history row exists
        const [dbFacility] = await db
            .select()
            .from(facilities)
            .where(eq(facilities.id, pendingFacility.id));
        expect(dbFacility.status).toBe('APPROVED');

        const [history] = await db
            .select()
            .from(facilityStatusHistory)
            .where(eq(facilityStatusHistory.facilityId, pendingFacility.id));
        expect(history).toBeDefined();
        expect(history.newStatus).toBe('APPROVED');
        expect(history.comment).toBe('All documentation verified. Approved.');
    });

    it('6.4 Should reject approving an already approved facility', async () => {
        const res = await request(app)
            .patch(`/api/admin/facilities/${pendingFacility.id}/approve`)
            .set('Cookie', adminCookie)
            .send({ comment: 'Duplicate approval attempt' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('6.5 Should reject a pending facility with a mandatory reason', async () => {
        // Create another pending facility to test rejection
        const [facilityToReject] = await db
            .insert(facilities)
            .values({
                ownerId: owner.id,
                name: 'Incomplete Facility',
                addressLine: '404 Missing Road',
                city: 'Delhi',
                state: 'Delhi',
                venueType: 'OUTDOOR',
                status: 'PENDING',
            })
            .returning();

        const res = await request(app)
            .patch(`/api/admin/facilities/${facilityToReject.id}/reject`)
            .set('Cookie', adminCookie)
            .send({ reason: 'Invalid address and incomplete court details.' });

        logger.record({
            scenario: 'Admin Reject Facility with Reason',
            method: 'PATCH',
            endpoint: `/api/admin/facilities/${facilityToReject.id}/reject`,
            requestBody: { reason: 'Invalid address and incomplete court details.' },
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.facility.status).toBe('REJECTED');
        expect(res.body.data.facility.rejectionReason).toBe(
            'Invalid address and incomplete court details.',
        );
    });
});

describe('7. Admin User Management', () => {
    let adminCookie;
    let adminUser;
    let targetUser;

    beforeAll(async () => {
        const adminAuth = await createAndLoginTestUser({ role: 'ADMIN' });
        adminCookie = adminAuth.cookie;
        adminUser = adminAuth.user;

        const targetAuth = await createAndLoginTestUser({ role: 'USER' });
        targetUser = targetAuth.user;
    });

    it('7.1 Should list users with search and filters via GET /api/admin/users', async () => {
        const res = await request(app)
            .get('/api/admin/users?role=user&page=1&limit=10')
            .set('Cookie', adminCookie);

        logger.record({
            scenario: 'List Users with Role and Pagination Filter',
            method: 'GET',
            endpoint: '/api/admin/users?role=user&page=1&limit=10',
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.users)).toBe(true);
        expect(res.body.data.pagination).toBeDefined();
    });

    it('7.2 Should get user details via GET /api/admin/users/:userId', async () => {
        const res = await request(app)
            .get(`/api/admin/users/${targetUser.id}`)
            .set('Cookie', adminCookie);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.user.id).toBe(targetUser.id);
    });

    it('7.3 Should ban user via PATCH /api/admin/users/:userId/ban', async () => {
        const res = await request(app)
            .patch(`/api/admin/users/${targetUser.id}/ban`)
            .set('Cookie', adminCookie);

        logger.record({
            scenario: 'Ban User Account',
            method: 'PATCH',
            endpoint: `/api/admin/users/${targetUser.id}/ban`,
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.user.isActive).toBe(false);

        const [dbUser] = await db.select().from(users).where(eq(users.id, targetUser.id));
        expect(dbUser.isActive).toBe(false);
    });

    it('7.4 Security: Admin cannot ban their own account or another admin', async () => {
        const resSelf = await request(app)
            .patch(`/api/admin/users/${adminUser.id}/ban`)
            .set('Cookie', adminCookie);
        expect(resSelf.statusCode).toBe(400);

        const otherAdmin = await createAndLoginTestUser({ role: 'ADMIN' });
        const resOther = await request(app)
            .patch(`/api/admin/users/${otherAdmin.user.id}/ban`)
            .set('Cookie', adminCookie);
        expect(resOther.statusCode).toBe(400);
    });

    it('7.5 Should unban user via PATCH /api/admin/users/:userId/unban', async () => {
        const res = await request(app)
            .patch(`/api/admin/users/${targetUser.id}/unban`)
            .set('Cookie', adminCookie);

        logger.record({
            scenario: 'Unban User Account',
            method: 'PATCH',
            endpoint: `/api/admin/users/${targetUser.id}/unban`,
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.user.isActive).toBe(true);

        const [dbUser] = await db.select().from(users).where(eq(users.id, targetUser.id));
        expect(dbUser.isActive).toBe(true);
    });
});

describe('8. Admin Dashboard & Analytics', () => {
    let adminCookie;

    beforeAll(async () => {
        const adminAuth = await createAndLoginTestUser({ role: 'ADMIN' });
        adminCookie = adminAuth.cookie;
    });

    it('8.1 Should get platform summary via GET /api/admin/dashboard/summary', async () => {
        const res = await request(app)
            .get('/api/admin/dashboard/summary')
            .set('Cookie', adminCookie);

        logger.record({
            scenario: 'Get Platform Dashboard Summary',
            method: 'GET',
            endpoint: '/api/admin/dashboard/summary',
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(typeof res.body.data.totalUsers).toBe('number');
        expect(typeof res.body.data.totalFacilities).toBe('number');
    });

    it('8.2 Should get booking trends via GET /api/admin/dashboard/bookings', async () => {
        const res = await request(app)
            .get('/api/admin/dashboard/bookings?period=daily')
            .set('Cookie', adminCookie);

        logger.record({
            scenario: 'Get Booking Trends Analytics',
            method: 'GET',
            endpoint: '/api/admin/dashboard/bookings?period=daily',
            statusCode: res.statusCode,
            responseBody: res.body,
        });

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data.trends)).toBe(true);
    });

    it('8.3 Should get user growth trends via GET /api/admin/dashboard/users', async () => {
        const res = await request(app)
            .get('/api/admin/dashboard/users?period=daily')
            .set('Cookie', adminCookie);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data.trends)).toBe(true);
    });

    it('8.4 Should get facility approval trends via GET /api/admin/dashboard/facilities', async () => {
        const res = await request(app)
            .get('/api/admin/dashboard/facilities?period=daily')
            .set('Cookie', adminCookie);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data.trends)).toBe(true);
    });

    it('8.5 Should get sports distribution via GET /api/admin/dashboard/sports', async () => {
        const res = await request(app)
            .get('/api/admin/dashboard/sports')
            .set('Cookie', adminCookie);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data.sports)).toBe(true);
    });

    it('8.6 Should get platform earnings summary via GET /api/admin/dashboard/earnings', async () => {
        const res = await request(app)
            .get('/api/admin/dashboard/earnings')
            .set('Cookie', adminCookie);

        expect(res.statusCode).toBe(200);
        expect(typeof res.body.data.totalRevenue).toBe('number');
    });
});
