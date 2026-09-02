import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import envConfig from './env.config.js';

const shouldUseSsl = /sslmode=require/i.test(envConfig.DATABASE_URL);
const pool = new Pool({
    connectionString: envConfig.DATABASE_URL,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
});

const db = drizzle(pool);

async function connectToDatabase() {
    try {
        await pool.query('select 1');
        console.log('Database connected');
    } catch (error) {
        console.error('Failed to connect to database', error);
        process.exit(1);
    }
}

export { db, pool, connectToDatabase };
