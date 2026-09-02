import { db } from '../config/database.config.js';
import { chunks } from '../db/schema/chunks.schema.js';
import { eq, inArray } from 'drizzle-orm';

/**
 * Create a single chunk record in the database.
 * @param {Object} chunkData - Chunk details matching the schema.
 * @param {string} [chunkData.fileId] - UUID of the parent file.
 * @param {string} [chunkData.chatId] - UUID of the parent chat.
 * @param {string} chunkData.text - Raw textual content of the chunk.
 * @param {string} chunkData.markdown - Extracted markdown syntax block of the chunk.
 * @param {string} [chunkData.source] - Source description metadata.
 * @param {Object} [chunkData.metadata] - Section headers and page indices mapping.
 * @param {string} [chunkData.metadata.h1] - First-level markdown header matching the chunk.
 * @param {string} [chunkData.metadata.h2] - Second-level markdown header matching the chunk.
 * @param {string} [chunkData.metadata.h3] - Third-level markdown header matching the chunk.
 * @param {number} [chunkData.metadata.startPage] - Page index start.
 * @param {number} [chunkData.metadata.endPage] - Page index end.
 * @param {number} [chunkData.metadata.chunkIndex] - Sequence index of the chunk.
 * @param {string} [chunkData.documentType] - Document classification tag.
 * @returns {Promise<object>} The created chunk record.
 */
export async function createChunk(chunkData) {
    const [chunk] = await db.insert(chunks).values(chunkData).returning();
    return chunk;
}

/**
 * Highly optimized batch insert of multiple chunk records in a single statement.
 * Recommended to batch inserts in chunks of 500-1000 items for very large lists.
 * @param {Array<Object>} chunksList - List of chunk records matching the schema.
 * @param {string} [chunksList[].fileId] - UUID of the parent file.
 * @param {string} [chunksList[].chatId] - UUID of the parent chat.
 * @param {string} chunksList[].text - Raw textual content of the chunk.
 * @param {string} chunksList[].markdown - Extracted markdown syntax block of the chunk.
 * @param {string} [chunksList[].source] - Source description metadata.
 * @param {Object} [chunksList[].metadata] - Section headers and page indices mapping.
 * @param {string} [chunksList[].documentType] - Document classification tag.
 * @returns {Promise<Array<object>>} The created chunk records.
 */
export async function createChunksBulk(chunksList) {
    if (!chunksList || chunksList.length === 0) return [];
    return db.insert(chunks).values(chunksList).returning();
}

/**
 * Retrieve a chunk by its internal ID.
 * @param {string} id - The UUID of the chunk.
 * @returns {Promise<object|null>} The chunk record or null if not found.
 */
export async function getChunkById(id) {
    const [chunk] = await db.select().from(chunks).where(eq(chunks.id, id));
    return chunk || null;
}

/**
 * Retrieve multiple chunk records by their internal UUIDs in a single query.
 * @param {Array<string>} chunkIds - Array of UUID strings.
 * @returns {Promise<Array<object>>} A list of matching chunk records.
 */
export async function getChunksByChunkIds(chunkIds) {
    if (!chunkIds || chunkIds.length === 0) return [];
    return db.select().from(chunks).where(inArray(chunks.id, chunkIds));
}

/**
 * List all chunks associated with a specific file.
 * @param {string} fileId - The UUID of the file.
 * @returns {Promise<Array<object>>} A list of chunk records.
 */
export async function listChunksByFileId(fileId) {
    return db.select().from(chunks).where(eq(chunks.fileId, fileId));
}

/**
 * List all chunks associated with a specific chat.
 * @param {string} chatId - The UUID of the chat.
 * @returns {Promise<Array<object>>} A list of chunk records.
 */
export async function listChunksByChatId(chatId) {
    return db.select().from(chunks).where(eq(chunks.chatId, chatId));
}

/**
 * Delete all chunks associated with a specific file.
 * @param {string} fileId - The UUID of the file.
 * @returns {Promise<Array<object>>} The deleted chunk records.
 */
export async function deleteChunksByFileId(fileId) {
    return db.delete(chunks).where(eq(chunks.fileId, fileId)).returning();
}

/**
 * Delete all chunk records from the database.
 * @returns {Promise<Array<object>>} The deleted chunk records.
 */
export async function deleteAllChunks() {
    return db.delete(chunks).returning();
}
