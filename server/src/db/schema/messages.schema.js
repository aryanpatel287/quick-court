import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { chats } from './chats.schema.js';

export const messages = pgTable(
    'messages',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        chatId: uuid('chat_id')
            .references(() => chats.id, { onDelete: 'cascade' })
            .notNull(),
        content: text('content').notNull(),
        role: text('role').notNull(), // 'user' | 'ai'
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => {
        return {
            chatIdIdx: index('messages_chat_id_idx').on(table.chatId),
        };
    },
);
