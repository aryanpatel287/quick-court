import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';

export const chats = pgTable(
    'chats',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
        guestId: text('guest_id'),
        title: text('title').default('New chat').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => {
        return {
            userIdIdx: index('chats_user_id_idx').on(table.userId),
            guestIdIdx: index('chats_guest_id_idx').on(table.guestId),
        };
    },
);
