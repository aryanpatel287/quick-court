import { db } from '../config/database.config.js';
import { files } from '../db/schema/files.schema.js';
import { eq, inArray } from 'drizzle-orm';

/**
 * Create a new file record.
 * @param {Object} fileData - File details matching the schema.
 * @param {string} fileData.fileId - The unique provider file ID (e.g. from ImageKit).
 * @param {string} fileData.name - Name of the file.
 * @param {number} fileData.size - Size in bytes.
 * @param {string} fileData.filePath - Absolute or relative storage path.
 * @param {string} fileData.url - Public access URL.
 * @param {string} fileData.fileType - Category of the file (e.g. pdf, image).
 * @param {string} fileData.mimetype - Internet media type of the file.
 * @param {string} [fileData.thumbnailUrl] - URL of generated preview or thumbnail.
 * @param {number} [fileData.width] - Width of the asset if image.
 * @param {number} [fileData.height] - Height of the asset if image.
 * @param {any} [fileData.aiTags] - Mixed/JSON storage for auto-generated AI tags.
 * @param {string} fileData.messageId - The UUID of the associated message.
 * @param {string} [fileData.uploadedBy] - The UUID of the user who uploaded the file.
 * @param {('pending'|'completed'|'failed')} [fileData.processingStatus] - General upload/parsing status.
 * @param {('pending'|'completed'|'failed')} [fileData.ragStatus] - RAG ingest indexation status.
 * @param {Object} [fileData.metadata] - Structural document metadata.
 * @param {string} [fileData.metadata.title] - Title of the document.
 * @param {string} [fileData.metadata.summary] - Brief summary generated for the file.
 * @param {Array<string>} [fileData.metadata.keywords] - Key phrases or tags.
 * @param {Array<string>} [fileData.metadata.sections] - Main sections in the document.
 * @param {Array<string>} [fileData.metadata.retrievalQueries] - Recommended query matches.
 * @param {string} [fileData.metadata.suggestedSystemContext] - Context context for RAG prompts.
 * @returns {Promise<object>} The created file record.
 */
export async function createFile(fileData) {
    const [file] = await db.insert(files).values(fileData).returning();
    return file;
}

/**
 * Batch insert multiple file records in a single query.
 * @param {Array<Object>} filesList - List of file records to insert.
 * @param {string} filesList[].fileId - The unique provider file ID (e.g. from ImageKit).
 * @param {string} filesList[].name - Name of the file.
 * @param {number} filesList[].size - Size in bytes.
 * @param {string} filesList[].filePath - Absolute or relative storage path.
 * @param {string} filesList[].url - Public access URL.
 * @param {string} filesList[].fileType - Category of the file (e.g. pdf, image).
 * @param {string} filesList[].mimetype - Internet media type of the file.
 * @param {string} [filesList[].thumbnailUrl] - URL of generated preview or thumbnail.
 * @param {number} [filesList[].width] - Width of the asset if image.
 * @param {number} [filesList[].height] - Height of the asset if image.
 * @param {any} [filesList[].aiTags] - Mixed/JSON storage for auto-generated AI tags.
 * @param {string} filesList[].messageId - The UUID of the associated message.
 * @param {string} [filesList[].uploadedBy] - The UUID of the user who uploaded the file.
 * @param {('pending'|'completed'|'failed')} [filesList[].processingStatus] - General upload/parsing status.
 * @param {('pending'|'completed'|'failed')} [filesList[].ragStatus] - RAG ingest indexation status.
 * @param {Object} [filesList[].metadata] - Structural document metadata.
 * @returns {Promise<Array<object>>} The created file records.
 */
export async function createFilesBulk(filesList) {
    if (!filesList || filesList.length === 0) return [];
    return db.insert(files).values(filesList).returning();
}

/**
 * Retrieve a file record by its internal UUID.
 * @param {string} id - The internal UUID of the file.
 * @returns {Promise<object|null>} The file record or null if not found.
 */
export async function getFileById(id) {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || null;
}

/**
 * Retrieve a file record by its external/provider fileId string.
 * @param {string} fileId - The provider fileId string (e.g. from ImageKit).
 * @returns {Promise<object|null>} The file record or null if not found.
 */
export async function getFileByFileId(fileId) {
    const [file] = await db.select().from(files).where(eq(files.fileId, fileId));
    return file || null;
}

/**
 * List files associated with a specific message.
 * @param {string} messageId - The UUID of the message.
 * @returns {Promise<Array<object>>} A list of file records.
 */
export async function listFilesByMessageId(messageId) {
    return db.select().from(files).where(eq(files.messageId, messageId));
}

/**
 * Update a specific file record.
 * @param {string} id - The internal UUID of the file.
 * @param {Object} updates - Column updates to set.
 * @param {string} [updates.fileId] - Provider file ID.
 * @param {string} [updates.name] - Name of the file.
 * @param {number} [updates.size] - Size in bytes.
 * @param {string} [updates.filePath] - Storage path.
 * @param {string} [updates.url] - URL.
 * @param {string} [updates.fileType] - Category.
 * @param {string} [updates.mimetype] - Mimetype.
 * @param {string} [updates.thumbnailUrl] - Thumbnail URL.
 * @param {number} [updates.width] - Width.
 * @param {number} [updates.height] - Height.
 * @param {any} [updates.aiTags] - AI Tags.
 * @param {string} [updates.messageId] - Associated message UUID.
 * @param {string} [updates.uploadedBy] - User UUID.
 * @param {('pending'|'completed'|'failed')} [updates.processingStatus] - Processing status.
 * @param {('pending'|'completed'|'failed')} [updates.ragStatus] - RAG status.
 * @param {Object} [updates.metadata] - Metadata.
 * @returns {Promise<object|null>} The updated file record or null if not found.
 */
export async function updateFile(id, updates) {
    const [file] = await db
        .update(files)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(files.id, id))
        .returning();
    return file || null;
}

/**
 * Optimized batch update of status/fields for multiple files to the same values in a single query.
 * @param {Array<string>} ids - List of internal file UUIDs to update.
 * @param {Object} updates - Status/column updates to set on all matching files.
 * @param {('pending'|'completed'|'failed')} [updates.processingStatus] - Processing status.
 * @param {('pending'|'completed'|'failed')} [updates.ragStatus] - RAG status.
 * @returns {Promise<Array<object>>} The updated file records.
 */
export async function updateFilesStatus(ids, updates) {
    if (!ids || ids.length === 0) return [];
    return db
        .update(files)
        .set({ ...updates, updatedAt: new Date() })
        .where(inArray(files.id, ids))
        .returning();
}

/**
 * Transactional batch update of different fields/updates for different files atomically.
 * @param {Array<{ id: string, updates: Object }>} filesUpdates - Array of update instructions.
 * @returns {Promise<Array<object>>} The updated file records.
 */
export async function updateMultipleFiles(filesUpdates) {
    if (!filesUpdates || filesUpdates.length === 0) return [];
    return db.transaction(async (tx) => {
        const results = [];
        for (const item of filesUpdates) {
            const [updatedFile] = await tx
                .update(files)
                .set({ ...item.updates, updatedAt: new Date() })
                .where(eq(files.id, item.id))
                .returning();
            if (updatedFile) {
                results.push(updatedFile);
            }
        }
        return results;
    });
}

/**
 * Delete a file record.
 * @param {string} id - The internal UUID of the file.
 * @returns {Promise<object|null>} The deleted file record or null if not found.
 */
export async function deleteFile(id) {
    const [file] = await db.delete(files).where(eq(files.id, id)).returning();
    return file || null;
}
