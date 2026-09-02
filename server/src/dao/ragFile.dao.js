import { db } from '../config/database.config.js';
import { ragFiles } from '../db/schema/rag_files.schema.js';
import { eq } from 'drizzle-orm';

/**
 * Create a new RAG file record.
 * @param {Object} fileData - File details matching the schema.
 * @param {string} fileData.fileId - The unique provider file ID (e.g. from ImageKit).
 * @param {string} fileData.name - Name of the file.
 * @param {number} fileData.size - Size in bytes.
 * @param {string} fileData.filePath - Storage path.
 * @param {string} fileData.url - Public access URL.
 * @param {string} fileData.fileType - Category of the file (e.g. pdf, image).
 * @param {string} fileData.mimetype - Internet media type of the file.
 * @param {string} [fileData.uploadedBy] - The UUID of the user who uploaded the file.
 * @param {('pending'|'completed'|'failed')} [fileData.processingStatus] - General upload/parsing status.
 * @param {('pending'|'completed'|'failed')} [fileData.ragStatus] - RAG ingest indexation status.
 * @param {Object} [fileData.metadata] - Structural document metadata.
 * @returns {Promise<object>} The created file record.
 */
export async function createRagFile(fileData) {
    const [file] = await db.insert(ragFiles).values(fileData).returning();
    return file;
}

/**
 * Batch insert multiple RAG file records in a single query.
 * @param {Array<Object>} filesList - List of file records to insert.
 * @returns {Promise<Array<object>>} The created file records.
 */
export async function createRagFilesBulk(filesList) {
    if (!filesList || filesList.length === 0) return [];
    return db.insert(ragFiles).values(filesList).returning();
}

/**
 * Retrieve a RAG file record by its internal UUID.
 * @param {string} id - The internal UUID of the file.
 * @returns {Promise<object|null>} The file record or null if not found.
 */
export async function getRagFileById(id) {
    const [file] = await db.select().from(ragFiles).where(eq(ragFiles.id, id));
    return file || null;
}

/**
 * Update a specific RAG file record.
 * @param {string} id - The internal UUID of the file.
 * @param {Object} updates - Column updates to set.
 * @returns {Promise<object|null>} The updated file record or null if not found.
 */
export async function updateRagFile(id, updates) {
    const [file] = await db
        .update(ragFiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(ragFiles.id, id))
        .returning();
    return file || null;
}

/**
 * Delete a RAG file record.
 * @param {string} id - The internal UUID of the file.
 * @returns {Promise<object|null>} The deleted file record or null if not found.
 */
export async function deleteRagFile(id) {
    const [file] = await db.delete(ragFiles).where(eq(ragFiles.id, id)).returning();
    return file || null;
}

/**
 * List all RAG file records.
 * @returns {Promise<Array<object>>} A list of file records.
 */
export async function listRagFiles() {
    return db.select().from(ragFiles);
}
