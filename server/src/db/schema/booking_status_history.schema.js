import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

import { bookings } from './bookings.schema.js';
import { users } from './users.schema.js';
import { bookingStatusEnum } from './enums.schema.js';

export const bookingStatusHistory = pgTable(
    'booking_status_history',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        bookingId: uuid('booking_id')
            .references(() => bookings.id, {
                onDelete: 'cascade',
            })
            .notNull(),

        /**
         * NULL when the transition happens automatically.
         *
         * Example:
         *
         * CONFIRMED → COMPLETED
         *
         * performed by cron/job.
         */
        changedBy: uuid('changed_by').references(() => users.id, {
            onDelete: 'restrict',
        }),

        oldStatus: bookingStatusEnum('old_status'),

        newStatus: bookingStatusEnum('new_status').notNull(),

        reason: text('reason'),

        createdAt: timestamp('created_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },

    (table) => ({
        bookingIdx: index('booking_status_history_booking_idx').on(table.bookingId),

        createdAtIdx: index('booking_status_history_created_at_idx').on(table.createdAt),
    }),
);
