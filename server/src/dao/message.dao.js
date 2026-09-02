import { db } from '../config/database.config.js';
import { messages } from '../db/schema/messages.schema.js';
import { eq } from 'drizzle-orm';

/**
 * Create a new message in the database.
 * @param {Object} messageData - Message details matching the schema.
 * @param {string} messageData.chatId - The UUID of the chat this message belongs to.
 * @param {string} messageData.content - The content text of the message.
 * @param {('user'|'ai')} messageData.role - The role of the sender.
 * @returns {Promise<object>} The created message record.
 */
export async function createMessage(messageData) {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
}

/**
 * Retrieve a message by its unique ID.
 * @param {string} id - The UUID of the message.
 * @returns {Promise<object|null>} The message record or null if not found.
 */
export async function getMessageById(id) {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || null;
}

/**
 * List all messages belonging to a specific chat session.
 * @param {string} chatId - The UUID of the chat.
 * @returns {Promise<Array<object>>} A list of message records.
 */
export async function listMessagesByChatId(chatId) {
    return db.select().from(messages).where(eq(messages.chatId, chatId));
}

/**
 * Delete a message by its ID.
 * @param {string} id - The UUID of the message.
 * @returns {Promise<object|null>} The deleted message record or null if not found.
 */
export async function deleteMessage(id) {
    const [message] = await db.delete(messages).where(eq(messages.id, id)).returning();
    return message || null;
}
