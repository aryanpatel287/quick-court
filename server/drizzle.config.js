import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import envConfig from './src/config/env.config.js';

export default defineConfig({
    schema: './src/db/schema/schema.js',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: envConfig.DATABASE_URL,
    },
});
