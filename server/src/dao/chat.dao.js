import { db } from '../config/database.config.js';
import { chats } from '../db/schema/chats.schema.js';
import { eq } from 'drizzle-orm';

/**
 * Create a new chat session in the database.
 * @param {Object} chatData - Chat details matching the schema.
 * @param {string} [chatData.userId] - The UUID of the registered user (required if guestId is absent).
 * @param {string} [chatData.guestId] - The guest session identifier string (required if userId is absent).
 * @param {string} [chatData.title] - The title of the chat (defaults to 'New chat').
 * @returns {Promise<object>} The created chat record.
 */
export async function createChat(chatData) {
    const [chat] = await db.insert(chats).values(chatData).returning();
    return chat;
}

/**
 * Retrieve a chat by its unique ID.
 * @param {string} id - The UUID of the chat.
 * @returns {Promise<object|null>} The chat record or null if not found.
 */
export async function getChatById(id) {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat || null;
}

/**
 * List all chats for a specific registered user.
 * @param {string} userId - The UUID of the user.
 * @returns {Promise<Array<object>>} A list of chat records.
 */
export async function listChatsByUserId(userId) {
    return db.select().from(chats).where(eq(chats.userId, userId));
}

/**
 * List all chats for a specific guest ID.
 * @param {string} guestId - The guest session identifier string.
 * @returns {Promise<Array<object>>} A list of chat records.
 */
export async function listChatsByGuestId(guestId) {
    return db.select().from(chats).where(eq(chats.guestId, guestId));
}

/**
 * Update chat properties (e.g. updating the title).
 * @param {string} id - The UUID of the chat.
 * @param {Object} updates - Column updates to set.
 * @param {string} [updates.title] - The new title of the chat.
 * @param {string} [updates.userId] - The new UUID of the registered user.
 * @param {string} [updates.guestId] - The new guest session identifier string.
 * @returns {Promise<object|null>} The updated chat record or null if not found.
 */
export async function updateChat(id, updates) {
    const [chat] = await db
        .update(chats)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(chats.id, id))
        .returning();
    return chat || null;
}

/**
 * Delete a chat session.
 * @param {string} id - The UUID of the chat to delete.
 * @returns {Promise<object|null>} The deleted chat record or null if not found.
 */
export async function deleteChat(id) {
    const [chat] = await db.delete(chats).where(eq(chats.id, id)).returning();
    return chat || null;
}
