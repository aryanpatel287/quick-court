import {
    pgTable,
    uuid,
    integer,
    text,
    timestamp,
    index,
    uniqueIndex,
    check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { facilities } from './facilities.schema.js';
import { users } from './users.schema.js';
import { bookings } from './bookings.schema.js';

export const reviews = pgTable(
    'reviews',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        facilityId: uuid('facility_id')
            .references(() => facilities.id, {
                onDelete: 'cascade',
            })
            .notNull(),

        userId: uuid('user_id')
            .references(() => users.id, {
                onDelete: 'restrict',
            })
            .notNull(),

        /**
         * Booking proves that the user actually used
         * the facility.
         */
        bookingId: uuid('booking_id')
            .references(() => bookings.id, {
                onDelete: 'restrict',
            })
            .notNull(),

        rating: integer('rating').notNull(),

        comment: text('comment'),

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
        facilityIdx: index('reviews_facility_id_idx').on(table.facilityId),

        userIdx: index('reviews_user_id_idx').on(table.userId),

        /**
         * One review per user per booking.
         */
        uniqueBookingReview: uniqueIndex('reviews_user_booking_unique_idx').on(
            table.userId,
            table.bookingId,
        ),

        ratingCheck: check('reviews_rating_check', sql`${table.rating} BETWEEN 1 AND 5`),
    }),
);
