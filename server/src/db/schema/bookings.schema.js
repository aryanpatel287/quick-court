import {
    pgTable,
    uuid,
    integer,
    numeric,
    text,
    timestamp,
    index,
    check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { users } from './users.schema.js';
import { courts } from './courts.schema.js';
import { bookingStatusEnum, currencyEnum } from './enums.schema.js';

export const bookings = pgTable(
    'bookings',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        /**
         * Human-readable booking ID.
         *
         * Format: BK-DDMMYYYY-XXXXXX (DDMMYYYY format)
         * Example: BK-02092026-000123
         */
        bookingReference: text('booking_reference').unique().notNull(),

        userId: uuid('user_id')
            .references(() => users.id, {
                onDelete: 'restrict',
            })
            .notNull(),

        courtId: uuid('court_id')
            .references(() => courts.id, {
                onDelete: 'restrict',
            })
            .notNull(),

        startTime: timestamp('start_time', {
            withTimezone: true,
        }).notNull(),

        endTime: timestamp('end_time', {
            withTimezone: true,
        }).notNull(),

        /**
         * Snapshot of the booking duration.
         */
        durationMinutes: integer('duration_minutes').notNull(),

        /**
         * ====================================================
         * HISTORICAL PRICE SNAPSHOT
         * ====================================================
         *
         * These values MUST NOT be recalculated from courts
         * after the booking has been created.
         *
         * Example:
         *
         * Booking created:
         *     Court = ₹400/hour
         *
         * Owner later changes court:
         *     ₹400 → ₹500/hour
         *
         * Existing booking remains:
         *     ₹400/hour
         */
        priceAmount: numeric('price_amount', {
            precision: 12,
            scale: 2,
        }).notNull(),

        priceCurrency: currencyEnum('price_currency').default('INR').notNull(),

        /**
         * Final amount charged for this booking.
         *
         * MVP:
         *
         * totalAmount =
         *     priceAmount * durationMinutes / 60
         *
         * Future discounts/taxes/platform fees can be
         * introduced without destroying historical data.
         */
        totalAmount: numeric('total_amount', {
            precision: 12,
            scale: 2,
        }).notNull(),

        totalCurrency: currencyEnum('total_currency').default('INR').notNull(),

        status: bookingStatusEnum('status').default('CONFIRMED').notNull(),

        cancelledAt: timestamp('cancelled_at', {
            withTimezone: true,
        }),

        cancellationReason: text('cancellation_reason'),

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
        userIdx: index('bookings_user_id_idx').on(table.userId),

        courtIdx: index('bookings_court_id_idx').on(table.courtId),

        /**
         * Primary availability lookup index.
         */
        courtStartIdx: index('bookings_court_start_idx').on(table.courtId, table.startTime),

        statusIdx: index('bookings_status_idx').on(table.status),

        startTimeIdx: index('bookings_start_time_idx').on(table.startTime),

        timeCheck: check('bookings_valid_time', sql`${table.startTime} < ${table.endTime}`),

        durationCheck: check('bookings_positive_duration', sql`${table.durationMinutes} > 0`),

        priceCheck: check('bookings_price_positive', sql`${table.priceAmount} > 0`),

        totalCheck: check('bookings_total_amount_non_negative', sql`${table.totalAmount} >= 0`),

        /**
         * Currency must remain consistent inside a booking.
         *
         * Currently every currency is INR, but this protects
         * the model if another currency is added later.
         */
        currencyConsistencyCheck: check(
            'bookings_currency_consistency',
            sql`${table.priceCurrency} = ${table.totalCurrency}`,
        ),

        cancellationCheck: check(
            'bookings_cancellation_fields_valid',
            sql`(status::text = 'CANCELLED')
             OR (
                 cancelled_at IS NULL
                 AND cancellation_reason IS NULL
             )`,
        ),
    }),
);
