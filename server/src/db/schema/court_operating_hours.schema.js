import { pgTable, uuid, integer, time, boolean, check, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { courts } from './courts.schema.js';

export const courtOperatingHours = pgTable(
    'court_operating_hours',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        courtId: uuid('court_id')
            .references(() => courts.id, {
                onDelete: 'cascade',
            })
            .notNull(),

        /**
         * 0 = Sunday
         * 1 = Monday
         * ...
         * 6 = Saturday
         */
        dayOfWeek: integer('day_of_week').notNull(),

        /**
         * NULL when isClosed = true.
         */
        startTime: time('start_time'),

        /**
         * NULL when isClosed = true.
         */
        endTime: time('end_time'),

        isClosed: boolean('is_closed').default(false).notNull(),
    },

    (table) => ({
        /**
         * One configuration per court/day.
         */
        courtDayUnique: uniqueIndex('court_operating_hours_court_day_unique_idx').on(
            table.courtId,
            table.dayOfWeek,
        ),

        dayCheck: check('court_operating_hours_day_check', sql`${table.dayOfWeek} BETWEEN 0 AND 6`),

        /**
         * Closed:
         *     start/end may be NULL.
         *
         * Open:
         *     start/end are required.
         *     start must be before end.
         */
        timeCheck: check(
            'court_operating_hours_valid_time',
            sql`(is_closed = true)
             OR (
                 is_closed = false
                 AND start_time IS NOT NULL
                 AND end_time IS NOT NULL
                 AND start_time < end_time
             )`,
        ),
    }),
);
