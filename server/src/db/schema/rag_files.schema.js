import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';

export const ragFiles = pgTable('rag_files', {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: text('file_id').notNull(),
    name: text('name').notNull(),
    size: integer('size').notNull(),
    filePath: text('file_path').notNull(),
    url: text('url').notNull(),
    fileType: text('file_type').notNull(),
    mimetype: text('mimetype').notNull(),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    processingStatus: text('processing_status').default('pending').notNull(),
    ragStatus: text('rag_status').default('pending').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
