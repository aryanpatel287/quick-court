import { pgTable, uuid, primaryKey, index } from 'drizzle-orm/pg-core';

import { facilities } from './facilities.schema.js';
import { sports } from './sports.schema.js';

export const facilitySports = pgTable(
    'facility_sports',
    {
        facilityId: uuid('facility_id')
            .references(() => facilities.id, {
                onDelete: 'cascade',
            })
            .notNull(),

        sportId: uuid('sport_id')
            .references(() => sports.id, {
                onDelete: 'restrict',
            })
            .notNull(),
    },

    (table) => ({
        /**
         * Prevents:
         *
         * Facility A + Badminton
         * Facility A + Badminton
         */
        pk: primaryKey({
            columns: [table.facilityId, table.sportId],
        }),

        sportIdx: index('facility_sports_sport_id_idx').on(table.sportId),
    }),
);
