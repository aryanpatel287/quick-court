import { pgTable, uuid, text, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { courts } from './courts.schema.js';
import { users } from './users.schema.js';

export const maintenanceBlocks = pgTable(
    'maintenance_blocks',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        courtId: uuid('court_id')
            .references(() => courts.id, {
                onDelete: 'cascade',
            })
            .notNull(),

        createdBy: uuid('created_by')
            .references(() => users.id, {
                onDelete: 'restrict',
            })
            .notNull(),

        startTime: timestamp('start_time', {
            withTimezone: true,
        }).notNull(),

        endTime: timestamp('end_time', {
            withTimezone: true,
        }).notNull(),

        reason: text('reason'),

        createdAt: timestamp('created_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },

    (table) => ({
        courtTimeIdx: index('maintenance_blocks_court_time_idx').on(table.courtId, table.startTime),

        timeCheck: check(
            'maintenance_blocks_valid_time',
            sql`${table.startTime} < ${table.endTime}`,
        ),
    }),
);
