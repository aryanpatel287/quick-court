import request from 'supertest';
import app from '../../app.js';
import redis from '../../config/cache.config.js';
import { FeatureApiDocLogger } from '../helpers/md-logger.js';
import { generateTestUserData, createAndLoginTestUser } from '../helpers/auth-helper.js';

const docLogger = new FeatureApiDocLogger(
    '01_auth_user.md',
    'Feature 01: Authentication & User Profile API',
    'Covers user registration, authentication, profile updates, role authorization, and session termination.',
);

describe('01: Auth & User Profile Management API', () => {
    let testUser;
    let authCookie;
    let adminUser;
    let adminCookie;

    beforeAll(async () => {
        const userAuth = await createAndLoginTestUser({ role: 'user' });
        testUser = userAuth.user;
        authCookie = userAuth.cookie;

        const adminAuth = await createAndLoginTestUser({ role: 'admin' });
        adminUser = adminAuth.user;
        adminCookie = adminAuth.cookie;
    });

    afterAll(() => {
        docLogger.save();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully (201 Created)', async () => {
            const signupPayload = generateTestUserData('signup_test');
            if (redis && redis.status === 'ready') {
                await redis.set(
                    `verified_email:${signupPayload.email.toLowerCase()}`,
                    'true',
                    'EX',
                    300,
                );
            }

            const res = await request(app).post('/api/auth/register').send(signupPayload);

            docLogger.record({
                scenario: 'Register New User (Success)',
                method: 'POST',
                endpoint: '/api/auth/register',
                requestBody: signupPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Registers new user and sets HTTP-only session cookie.',
            });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data?.user || res.body.user).toBeDefined();
        });

        it('should return 400 when registration fails validation', async () => {
            const invalidPayload = { email: 'invalid-email', password: '' };

            const res = await request(app).post('/api/auth/register').send(invalidPayload);

            docLogger.record({
                scenario: 'Register User (Validation Failure)',
                method: 'POST',
                endpoint: '/api/auth/register',
                requestBody: invalidPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Returns validation errors when required fields are missing or malformed.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should authenticate user and return token (200 OK)', async () => {
            const loginPayload = {
                email: testUser.email,
                password: 'Password@123',
            };

            const res = await request(app).post('/api/auth/login').send(loginPayload);

            docLogger.record({
                scenario: 'User Login (Success)',
                method: 'POST',
                endpoint: '/api/auth/login',
                requestBody: loginPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Authenticates credentials and sets HTTP-only session token.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 401 on invalid credentials', async () => {
            const invalidLogin = {
                email: testUser.email,
                password: 'WrongPassword!999',
            };

            const res = await request(app).post('/api/auth/login').send(invalidLogin);

            docLogger.record({
                scenario: 'User Login (Invalid Credentials)',
                method: 'POST',
                endpoint: '/api/auth/login',
                requestBody: invalidLogin,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Rejects invalid password attempt.',
            });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/get-me', () => {
        it('should return authenticated user profile (200 OK)', async () => {
            const res = await request(app).get('/api/auth/get-me').set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Get Current Authenticated User (Success)',
                method: 'GET',
                endpoint: '/api/auth/get-me',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Retrieves current active session user object.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const userObj = res.body.data?.user || res.body.user;
            expect(userObj.email).toBe(testUser.email);
        });

        it('should return 401 when accessed without credentials', async () => {
            const res = await request(app).get('/api/auth/get-me');

            docLogger.record({
                scenario: 'Get Current User (Unauthenticated Error)',
                method: 'GET',
                endpoint: '/api/auth/get-me',
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Protected route returns 401 when session cookie is missing.',
            });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('PATCH /api/auth/change-password', () => {
        it('should change user password successfully (200 OK)', async () => {
            const changePayload = {
                currentPassword: 'Password@123',
                newPassword: 'NewPassword@456',
            };

            const res = await request(app)
                .patch('/api/auth/change-password')
                .set('Cookie', authCookie)
                .send(changePayload);

            docLogger.record({
                scenario: 'Change Password (Success)',
                method: 'PATCH',
                endpoint: '/api/auth/change-password',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: changePayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Verifies current password and rotates to new password hash.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 400 when current password is wrong', async () => {
            const wrongPayload = {
                currentPassword: 'IncorrectOldPassword',
                newPassword: 'AnotherPassword@789',
            };

            const res = await request(app)
                .patch('/api/auth/change-password')
                .set('Cookie', authCookie)
                .send(wrongPayload);

            docLogger.record({
                scenario: 'Change Password (Wrong Current Password)',
                method: 'PATCH',
                endpoint: '/api/auth/change-password',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: wrongPayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Rejects password update when current password does not match.',
            });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/users/get-me & PATCH /api/users/profile', () => {
        it('should retrieve user profile via user routes (200 OK)', async () => {
            const res = await request(app).get('/api/users/get-me').set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Get User Profile via User Router (Success)',
                method: 'GET',
                endpoint: '/api/users/get-me',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Retrieves user details under user router namespace.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should update user profile details (200 OK)', async () => {
            const updatePayload = {
                firstName: 'UpdatedFirst',
                lastName: 'UpdatedLast',
            };

            const res = await request(app)
                .patch('/api/users/profile')
                .set('Cookie', authCookie)
                .send(updatePayload);

            docLogger.record({
                scenario: 'Update User Profile Details (Success)',
                method: 'PATCH',
                endpoint: '/api/users/profile',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                requestBody: updatePayload,
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Updates user profile fields and returns updated entity.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('Admin RBAC Management Endpoints', () => {
        it('should allow admin to list all users (200 OK)', async () => {
            const res = await request(app).get('/api/admin/users').set('Cookie', adminCookie);

            docLogger.record({
                scenario: 'Admin List Users (Authorized)',
                method: 'GET',
                endpoint: '/api/admin/users',
                headers: { Cookie: 'token=ADMIN_JWT_COOKIE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Admin access level lists all registered users in database.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data?.users || res.body.users)).toBe(true);
        });

        it('should forbid non-admin users from accessing admin routes (403 Forbidden)', async () => {
            const res = await request(app).get('/api/admin/users').set('Cookie', authCookie);

            docLogger.record({
                scenario: 'Admin List Users (Forbidden for Non-Admin)',
                method: 'GET',
                endpoint: '/api/admin/users',
                headers: { Cookie: 'token=USER_JWT_COOKIE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'RBAC restriction blocks standard users with 403 Forbidden.',
            });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout user and clear session cookie (200 OK)', async () => {
            const res = await request(app).post('/api/auth/logout').set('Cookie', authCookie);

            docLogger.record({
                scenario: 'User Logout (Success)',
                method: 'POST',
                endpoint: '/api/auth/logout',
                headers: { Cookie: 'token=JWT_COOKIE_VALUE' },
                statusCode: res.status,
                responseBody: res.body,
                notes: 'Blacklists active JWT and clears cookie on client.',
            });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
