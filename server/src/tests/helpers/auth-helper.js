import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../config/database.config.js';
import { users } from '../../db/schema/users.schema.js';
import { facilities } from '../../db/schema/facilities.schema.js';
import { courts } from '../../db/schema/courts.schema.js';
import { sports } from '../../db/schema/sports.schema.js';
import { facilitySports } from '../../db/schema/facility_sports.schema.js';
import { courtOperatingHours } from '../../db/schema/court_operating_hours.schema.js';
import envConfig from '../../config/env.config.js';
import { eq } from 'drizzle-orm';

/**
 * Generate randomized user data to avoid unique constraint collisions
 */
export function generateTestUserData(prefix = 'test_user') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return {
        firstName: 'Test',
        lastName: 'User',
        email: `${prefix}_${timestamp}_${random}@apex.io`,
        password: 'Password@123',
        role: 'USER',
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

/**
 * Helper to directly create and authenticate a FACILITY_OWNER
 */
export async function createAndLoginTestOwner(overrides = {}) {
    return createAndLoginTestUser({
        role: 'FACILITY_OWNER',
        firstName: 'Owner',
        lastName: 'Test',
        ...overrides,
    });
}

/**
 * Helper to directly create and authenticate an ADMIN
 */
export async function createAndLoginTestAdmin(overrides = {}) {
    return createAndLoginTestUser({
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'Test',
        ...overrides,
    });
}

/**
 * Helper to seed a test facility with court and operating hours for integration tests
 */
export async function createTestFacilityAndCourt({ ownerId, status = 'APPROVED' } = {}) {
    let finalOwnerId = ownerId;
    if (!finalOwnerId) {
        const ownerAuth = await createAndLoginTestOwner();
        finalOwnerId = ownerAuth.user.id;
    }

    // Get an existing sport or insert a default one
    let [sport] = await db.select().from(sports).limit(1);
    if (!sport) {
        [sport] = await db
            .insert(sports)
            .values({
                name: 'Badminton',
                iconUrl: 'https://placehold.co/100x100.png',
            })
            .returning();
    }

    const timestamp = Date.now();
    const [facility] = await db
        .insert(facilities)
        .values({
            ownerId: finalOwnerId,
            name: `Test Facility ${timestamp}`,
            description: 'Automated integration testing venue',
            addressLine: '123 Court Lane',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560001',
            venueType: 'INDOOR',
            status,
        })
        .returning();

    // Link sport to facility
    try {
        await db.insert(facilitySports).values({
            facilityId: facility.id,
            sportId: sport.id,
        });
    } catch (_err) {
        // Ignore duplicate primary key if already linked
    }

    const [court] = await db
        .insert(courts)
        .values({
            facilityId: facility.id,
            sportId: sport.id,
            name: 'Center Court 1',
            priceAmount: '500.00',
            priceCurrency: 'INR',
            isActive: true,
        })
        .returning();

    // Seed standard operating hours (06:00 - 23:00) for all days
    for (let day = 0; day <= 6; day++) {
        await db.insert(courtOperatingHours).values({
            courtId: court.id,
            dayOfWeek: day,
            startTime: '06:00:00',
            endTime: '23:00:00',
            isClosed: false,
        });
    }

    return {
        facility,
        court,
        sport,
        ownerId: finalOwnerId,
    };
}
