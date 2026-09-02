import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, pool } from '../config/database.config.js';
import { users } from './schema/users.schema.js';
import { seedCrud } from '../modules/crud/seed/index.js';

async function seedUsers() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const seedUsers = [
        {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin',
            emailVerified: true,
            isActive: true,
            isDeleted: false,
        },
        ...Array.from({ length: 10 }, (_, i) => ({
            firstName: 'User',
            lastName: `${i + 1}`,
            email: `user${i + 1}@example.com`,
            password: hashedPassword,
            role: 'user',
            emailVerified: true,
            isActive: true,
            isDeleted: false,
        })),
    ];

    try {
        const existingUsers = await db.select().from(users).limit(1);
        if (existingUsers.length > 0) {
            console.log('Users table already has records. Skipping user seeding...');
            return;
        }

        await db.insert(users).values(seedUsers).returning();
        console.log(`Seeded ${seedUsers.length} users successfully`);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
}

async function main() {
    await seedUsers();
    try {
        await seedCrud();
        console.log('Seeded CRUD entities and records successfully');
    } catch (err) {
        console.error('Error seeding CRUD:', err);
    }
    await pool.end();
    process.exit(0);
}

main();
