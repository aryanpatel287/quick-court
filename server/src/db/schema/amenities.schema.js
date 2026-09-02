import { pgTable, uuid, text, boolean } from 'drizzle-orm/pg-core';

export const amenities = pgTable('amenities', {
    id: uuid('id').defaultRandom().primaryKey(),

    name: text('name').unique().notNull(),

    isActive: boolean('is_active').default(true).notNull(),
});
