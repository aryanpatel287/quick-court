import { pgTable, uuid, text, boolean } from 'drizzle-orm/pg-core';

export const sports = pgTable('sports', {
    id: uuid('id').defaultRandom().primaryKey(),

    name: text('name').unique().notNull(),

    /**
     * URL/filter-friendly identifier.
     *
     * Example:
     * badminton
     * table-tennis
     * football
     */
    slug: text('slug').unique().notNull(),

    /**
     * Allows platform to disable a sport without
     * destroying historical relationships.
     */
    isActive: boolean('is_active').default(true).notNull(),
});
