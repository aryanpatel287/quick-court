import {
    pgTable,
    uuid,
    text,
    numeric,
    boolean,
    timestamp,
    index,
    check,
    uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { facilities } from './facilities.schema.js';
import { sports } from './sports.schema.js';
import { currencyEnum } from './enums.schema.js';

export const courts = pgTable(
    'courts',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        facilityId: uuid('facility_id')
            .references(() => facilities.id, {
                onDelete: 'restrict',
            })
            .notNull(),

        sportId: uuid('sport_id')
            .references(() => sports.id, {
                onDelete: 'restrict',
            })
            .notNull(),

        name: text('name').notNull(),

        /**
         * ====================================================
         * MONEY
         * ====================================================
         *
         * Current price of this court.
         *
         * Example:
         *
         * priceAmount   = 500.00
         * priceCurrency = INR
         *
         * DO NOT store "₹500/hour" as a text field.
         */
        priceAmount: numeric('price_amount', {
            precision: 12,
            scale: 2,
        }).notNull(),

        priceCurrency: currencyEnum('price_currency').default('INR').notNull(),

        /**
         * false = no new bookings.
         *
         * Existing historical bookings remain intact.
         */
        isActive: boolean('is_active').default(true).notNull(),

        createdAt: timestamp('created_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },

    (table) => ({
        facilityIdx: index('courts_facility_id_idx').on(table.facilityId),

        sportIdx: index('courts_sport_id_idx').on(table.sportId),

        facilitySportIdx: index('courts_facility_sport_idx').on(table.facilityId, table.sportId),

        /**
         * Court names only need to be unique inside
         * their own facility.
         */
        facilityNameUnique: uniqueIndex('courts_facility_name_unique_idx').on(
            table.facilityId,
            table.name,
        ),

        priceCheck: check('courts_price_positive', sql`${table.priceAmount} > 0`),
    }),
);
