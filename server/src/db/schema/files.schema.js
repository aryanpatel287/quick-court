import { pgTable, uuid, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { messages } from './messages.schema.js';
import { users } from './users.schema.js';

export const files = pgTable(
    'files',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        fileId: text('file_id').notNull(),
        name: text('name').notNull(),
        size: integer('size').notNull(),
        filePath: text('file_path').notNull(),
        url: text('url').notNull(),
        fileType: text('file_type').notNull(),
        mimetype: text('mimetype').notNull(),
        thumbnailUrl: text('thumbnail_url'),
        width: integer('width'),
        height: integer('height'),
        aiTags: jsonb('ai_tags'),
        messageId: uuid('message_id')
            .references(() => messages.id, { onDelete: 'cascade' })
            .notNull(),
        uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
        processingStatus: text('processing_status').default('pending').notNull(), // 'pending' | 'completed' | 'failed'
        ragStatus: text('rag_status').default('pending').notNull(), // 'pending' | 'completed' | 'failed'
        metadata: jsonb('metadata'), // title, summary, keywords, sections, retrievalQueries, suggestedSystemContext
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => {
        return {
            messageIdIdx: index('files_message_id_idx').on(table.messageId),
            uploadedByIdx: index('files_uploaded_by_idx').on(table.uploadedBy),
        };
    },
);
