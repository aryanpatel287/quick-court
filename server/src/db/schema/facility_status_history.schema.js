import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

import { facilities } from './facilities.schema.js';
import { users } from './users.schema.js';
import { facilityStatusEnum } from './enums.schema.js';

export const facilityStatusHistory = pgTable(
    'facility_status_history',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        facilityId: uuid('facility_id')
            .references(() => facilities.id, {
                onDelete: 'cascade',
            })
            .notNull(),

        /**
         * Admin responsible for the status transition.
         */
        changedBy: uuid('changed_by')
            .references(() => users.id, {
                onDelete: 'restrict',
            })
            .notNull(),

        /**
         * NULL for the initial state.
         */
        oldStatus: facilityStatusEnum('old_status'),

        newStatus: facilityStatusEnum('new_status').notNull(),

        comment: text('comment'),

        createdAt: timestamp('created_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },

    (table) => ({
        facilityIdx: index('facility_status_history_facility_idx').on(table.facilityId),

        createdAtIdx: index('facility_status_history_created_at_idx').on(table.createdAt),
    }),
);
