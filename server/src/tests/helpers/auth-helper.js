import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../config/database.config.js';
import { users } from '../../db/schema/users.schema.js';
import envConfig from '../../config/env.config.js';

/**
 * Generate randomized user data to avoid unique constraint collisions
 */
export function generateTestUserData(prefix = 'test_user') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    return {
        firstName: 'Test',
        lastName: 'User',
        email: `${prefix}_${timestamp}_${random}@apex.io`,
        password: 'Password@123',
        role: 'user',
    };
}

/**
 * Directly create an authenticated test user and return records + auth headers/cookies
 */
export async function createAndLoginTestUser(overrides = {}) {
    const payload = {
        ...generateTestUserData(),
        ...overrides,
    };

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    let dbRole = 'USER';
    const roleStr = String(payload.role || '').toUpperCase();
    if (roleStr === 'ADMIN') dbRole = 'ADMIN';
    else if (roleStr === 'FACILITY_OWNER') dbRole = 'FACILITY_OWNER';

    const [user] = await db
        .insert(users)
        .values({
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            password: hashedPassword,
            role: dbRole,
            isActive: payload.isActive !== undefined ? payload.isActive : true,
            emailVerified: payload.emailVerified !== undefined ? payload.emailVerified : true,
        })
        .returning();

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        envConfig.JWT_SECRET || 'test-jwt-secret-key',
        { expiresIn: '1d' },
    );

    return {
        user,
        token,
        cookie: `token=${token}`,
        authHeader: `Bearer ${token}`,
    };
}
