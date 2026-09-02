import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { files } from './files.schema.js';
import { chats } from './chats.schema.js';
import { ragFiles } from './rag_files.schema.js';

export const chunks = pgTable(
    'chunks',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        fileId: uuid('file_id').references(() => files.id, { onDelete: 'cascade' }),
        chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'cascade' }),
        ragFileId: uuid('rag_file_id').references(() => ragFiles.id, { onDelete: 'cascade' }),
        text: text('text').notNull(),
        markdown: text('markdown').notNull(),
        source: text('source'),
        metadata: jsonb('metadata'), // h1, h2, h3, startPage, endPage, chunkIndex
        documentType: text('document_type'),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => {
        return {
            fileIdIdx: index('chunks_file_id_idx').on(table.fileId),
            chatIdIdx: index('chunks_chat_id_idx').on(table.chatId),
            ragFileIdIdx: index('chunks_rag_file_id_idx').on(table.ragFileId),
        };
    },
);
