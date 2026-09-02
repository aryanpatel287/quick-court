import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const payments = pgTable(
    'payments',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orderId: text('order_id').notNull(),
        paymentId: text('payment_id'),
        signature: text('signature'),
        amount: integer('amount').notNull(),
        currency: text('currency').notNull(),
        status: text('status').default('pending').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => {
        return {
            orderIdIdx: index('payments_order_id_idx').on(table.orderId),
            paymentIdIdx: index('payments_payment_id_idx').on(table.paymentId),
        };
    },
);
