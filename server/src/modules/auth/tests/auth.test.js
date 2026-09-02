import request from 'supertest';
import app from '../../../app.js';
import { db } from '../../../config/database.config.js';
import { users } from '../../../db/schema/users.schema.js';
import redis from '../../../config/cache.config.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const logFilePath = path.resolve('../.ai/API_RESPONSE.md');
const moduleLogs = [];

function queueApiResponse(testName, method, endpoint, requestBody, statusCode, responseBody) {
    const markdown = `
### ${testName}
- **Request**: \`${method} ${endpoint}\`
- **Response Status**: \`${statusCode}\`
${requestBody ? `- **Request Body**:\n\`\`\`json\n${JSON.stringify(requestBody, null, 4)}\n\`\`\`` : ''}
- **Response Body**:
\`\`\`json
${JSON.stringify(responseBody, null, 4)}
\`\`\`
`;
    moduleLogs.push(markdown);
}

function logModuleResponses(moduleName, logs) {
    try {
        const dir = path.dirname(logFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let content = '';
        if (fs.existsSync(logFilePath)) {
            content = fs.readFileSync(logFilePath, 'utf8');
        }

        const titleHeader =
            '# API Response Logs\n\nGenerated automatically during integration test runs.\n\n';
        if (!content.trim()) {
            content = titleHeader;
        } else if (!content.startsWith('# API Response Logs')) {
            content = titleHeader + content;
        }

        const moduleHeader = `## ${moduleName}`;
        const newSection = `${moduleHeader}\n\n${logs}`;

        const moduleIndex = content.indexOf(moduleHeader);
        if (moduleIndex !== -1) {
            const rest = content.slice(moduleIndex + moduleHeader.length);
            const nextModuleMatch = rest.match(/\n## /);
            if (nextModuleMatch) {
                const nextModuleIndex = moduleIndex + moduleHeader.length + nextModuleMatch.index;
                content =
                    content.slice(0, moduleIndex) +
                    newSection +
                    '\n' +
                    content.slice(nextModuleIndex).trim() +
                    '\n';
            } else {
                content = content.slice(0, moduleIndex) + newSection + '\n';
            }
        } else {
            content = content.trim() + '\n\n' + newSection + '\n';
        }

        fs.writeFileSync(logFilePath, content);
    } catch (err) {
        console.error('Error logging API responses:', err);
    }
}

describe('Authentication Module Integration Tests', () => {
    const testUser = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
    };

    const testAdmin = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminpassword',
    };

    beforeEach(async () => {
        const keys = await redis.keys('ratelimit:*');
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    });

    afterAll(async () => {
        if (moduleLogs.length > 0) {
            logModuleResponses('Auth Module', moduleLogs.join('\n---\n'));
        }
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully and return user details with a cookie', async () => {
            const res = await request(app).post('/api/auth/register').send(testUser);

            queueApiResponse(
                'User Registration Success',
                'POST',
                '/api/auth/register',
                testUser,
                res.statusCode,
                res.body,
            );

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.name).toBe(testUser.name);
            expect(res.body.data.user.email).toBe(testUser.email);
            expect(res.body.data.user.role).toBe('USER');
            expect(res.body.data.user.password).toBeUndefined();
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'][0]).toContain('token=');
        });

        it('should fail registration when validation constraints are not met', async () => {
            const invalidData = {
                name: '',
                email: 'invalid-email',
                password: '123',
            };
            const res = await request(app).post('/api/auth/register').send(invalidData);

            queueApiResponse(
                'User Registration Validation Failure',
                'POST',
                '/api/auth/register',
                invalidData,
                res.statusCode,
                res.body,
            );

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Validation failed');
            expect(res.body.errors).toBeDefined();
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash(testUser.password, salt);
            await db.insert(users).values({
                name: testUser.name,
                email: testUser.email,
                password,
                role: 'USER',
            });
        });

        it('should login user successfully with correct credentials and set token cookie', async () => {
            const loginData = {
                email: testUser.email,
                password: testUser.password,
            };
            const res = await request(app).post('/api/auth/login').send(loginData);

            queueApiResponse(
                'User Login Success',
                'POST',
                '/api/auth/login',
                loginData,
                res.statusCode,
                res.body,
            );

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(testUser.email);
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'][0]).toContain('token=');
        });

        it('should reject login for wrong password', async () => {
            const loginData = {
                email: testUser.email,
                password: 'wrongpassword',
            };
            const res = await request(app).post('/api/auth/login').send(loginData);

            queueApiResponse(
                'User Login Failure (Wrong Password)',
                'POST',
                '/api/auth/login',
                loginData,
                res.statusCode,
                res.body,
            );

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid email or password');
        });
    });

    describe('POST /api/auth/logout', () => {
        let cookie;

        beforeEach(async () => {
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash(testUser.password, salt);
            await db.insert(users).values({
                name: testUser.name,
                email: testUser.email,
                password,
                role: 'USER',
            });

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password });
            cookie = loginRes.headers['set-cookie'];
        });

        it('should log out user, clear cookie and blacklist the JWT token in Redis', async () => {
            const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);

            queueApiResponse(
                'User Logout Success',
                'POST',
                '/api/auth/logout',
                null,
                res.statusCode,
                res.body,
            );

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.headers['set-cookie'][0]).toContain('token=;');

            const protectRes = await request(app).get('/api/auth/me').set('Cookie', cookie);

            queueApiResponse(
                'Access Profile with Blacklisted Token',
                'GET',
                '/api/auth/me',
                null,
                protectRes.statusCode,
                protectRes.body,
            );

            expect(protectRes.statusCode).toBe(401);
            expect(protectRes.body.message).toContain(
                'Your session has expired or been logged out',
            );
        });
    });

    describe('Authorization & RBAC', () => {
        let userCookie;
        let adminCookie;

        beforeEach(async () => {
            const salt = await bcrypt.genSalt(10);

            await db.insert(users).values({
                name: testUser.name,
                email: testUser.email,
                password: await bcrypt.hash(testUser.password, salt),
                role: 'USER',
            });

            await db.insert(users).values({
                name: testAdmin.name,
                email: testAdmin.email,
                password: await bcrypt.hash(testAdmin.password, salt),
                role: 'ADMIN',
            });

            const userLogin = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password });
            userCookie = userLogin.headers['set-cookie'];

            const adminLogin = await request(app)
                .post('/api/auth/login')
                .send({ email: testAdmin.email, password: testAdmin.password });
            adminCookie = adminLogin.headers['set-cookie'];
        });

        it('should allow user to access their own profile', async () => {
            const res = await request(app).get('/api/auth/me').set('Cookie', userCookie);

            queueApiResponse(
                'Get Current User (Success)',
                'GET',
                '/api/auth/me',
                null,
                res.statusCode,
                res.body,
            );

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(testUser.email);
        });

        it('should deny profile access to unauthenticated requests', async () => {
            const res = await request(app).get('/api/auth/me');

            queueApiResponse(
                'Get Current User (Unauthenticated)',
                'GET',
                '/api/auth/me',
                null,
                res.statusCode,
                res.body,
            );

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should deny non-admin access to admin user listing', async () => {
            const res = await request(app).get('/api/auth/users').set('Cookie', userCookie);

            queueApiResponse(
                'List Users as User (RBAC Denied)',
                'GET',
                '/api/auth/users',
                null,
                res.statusCode,
                res.body,
            );

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('You do not have permission');
        });

        it('should allow admin access to list users', async () => {
            const res = await request(app).get('/api/auth/users').set('Cookie', adminCookie);

            queueApiResponse(
                'List Users as Admin (Success)',
                'GET',
                '/api/auth/users',
                null,
                res.statusCode,
                res.body,
            );

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.users).toBeDefined();
            expect(res.body.data.users.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('User Profile Management & Soft Delete', () => {
        let cookie;

        beforeEach(async () => {
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash(testUser.password, salt);
            await db.insert(users).values({
                name: testUser.name,
                email: testUser.email,
                password,
                role: 'USER',
            });

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password });
            cookie = loginRes.headers['set-cookie'];
        });

        it('should allow current user to update profile name', async () => {
            const updateData = { name: 'John Updated' };
            const res = await request(app)
                .patch('/api/auth/profile')
                .set('Cookie', cookie)
                .send(updateData);

            queueApiResponse(
                'Update Profile Name',
                'PATCH',
                '/api/auth/profile',
                updateData,
                res.statusCode,
                res.body,
            );

            expect(res.statusCode).toBe(200);
            expect(res.body.data.user.name).toBe('John Updated');
        });

        it('should allow current user to change password', async () => {
            const passData = {
                currentPassword: testUser.password,
                newPassword: 'newpassword123',
            };
            const res = await request(app)
                .patch('/api/auth/change-password')
                .set('Cookie', cookie)
                .send(passData);

            queueApiResponse(
                'Change Password',
                'PATCH',
                '/api/auth/change-password',
                passData,
                res.statusCode,
                res.body,
            );

            expect(res.statusCode).toBe(200);

            const loginRes = await request(app).post('/api/auth/login').send({
                email: testUser.email,
                password: 'newpassword123',
            });
            expect(loginRes.statusCode).toBe(200);
        });

        it('should soft delete own account and prevent future logins or me access', async () => {
            const res = await request(app).delete('/api/auth/account').set('Cookie', cookie);

            queueApiResponse(
                'Self Soft-Delete Account',
                'DELETE',
                '/api/auth/account',
                null,
                res.statusCode,
                res.body,
            );

            expect(res.statusCode).toBe(200);

            const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie);
            expect(meRes.statusCode).toBe(401);

            const loginRes = await request(app).post('/api/auth/login').send({
                email: testUser.email,
                password: testUser.password,
            });

            queueApiResponse(
                'Login Attempt as Deleted User',
                'POST',
                '/api/auth/login',
                { email: testUser.email, password: testUser.password },
                loginRes.statusCode,
                loginRes.body,
            );

            expect(loginRes.statusCode).toBe(401);
            expect(loginRes.body.message).toContain('Invalid email or password');
        });
    });
});
