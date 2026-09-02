import {
    pgTable,
    uuid,
    text,
    numeric,
    timestamp,
    index,
    uniqueIndex,
    check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { bookings } from './bookings.schema.js';

import { paymentStatusEnum, currencyEnum } from './enums.schema.js';

export const payments = pgTable(
    'payments',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        /**
         * Current MVP:
         *
         * ONE booking → ONE payment record.
         */
        bookingId: uuid('booking_id')
            .references(() => bookings.id, {
                onDelete: 'restrict',
            })
            .notNull(),

        /**
         * Future payment gateway support.
         *
         * Example:
         * Razorpay order ID.
         */
        orderId: text('order_id'),

        /**
         * Future payment gateway payment ID.
         */
        paymentId: text('payment_id'),

        /**
         * Future gateway signature.
         */
        signature: text('signature'),

        /**
         * Actual amount associated with this payment.
         *
         * Backend/transaction must ensure:
         *
         * payments.amount
         *     ===
         * bookings.total_amount
         */
        amount: numeric('amount', {
            precision: 12,
            scale: 2,
        }).notNull(),

        currency: currencyEnum('currency').default('INR').notNull(),

        status: paymentStatusEnum('status').default('PENDING').notNull(),

        /**
         * Set only after successful payment.
         */
        paidAt: timestamp('paid_at', {
            withTimezone: true,
        }),

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
        /**
         * One payment record per booking for MVP.
         */
        bookingUniqueIdx: uniqueIndex('payments_booking_id_unique_idx').on(table.bookingId),

        orderIdx: index('payments_order_id_idx').on(table.orderId),

        paymentIdx: index('payments_payment_id_idx').on(table.paymentId),

        statusIdx: index('payments_status_idx').on(table.status),

        amountCheck: check('payments_amount_non_negative', sql`${table.amount} >= 0`),

        /**
         * Successful payment MUST have paid_at.
         */
        paidAtConsistencyCheck: check(
            'payments_paid_at_consistency',
            sql`(status::text = 'SUCCESS' AND paid_at IS NOT NULL)
             OR
             (status::text <> 'SUCCESS')`,
        ),
    }),
);
