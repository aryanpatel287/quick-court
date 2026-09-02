import redis from '../../config/cache.config.js';

const KEY_PREFIX = 'active_stream:';
const TTL = 600; // 10 minutes auto-expiration

/**
 * Initializes and starts tracking an active AI stream for a specific chat in Redis.
 *
 * @param {string} chatId - Unique ID of the chat conversation.
 * @returns {Promise<void>}
 */
export async function startTracking(chatId) {
    const key = `${KEY_PREFIX}${chatId}`;
    await redis.hset(key, {
        status: 'active',
        thinking: '',
        toolCalls: '[]',
        updatedAt: Date.now(),
    });
    await redis.expire(key, TTL);
}

/**
 * Updates the accumulated internal thinking state of the AI model for a given chat in Redis.
 *
 * @param {string} chatId - Unique ID of the chat conversation.
 * @param {string} thinking - The current thinking text output from the model.
 * @returns {Promise<void>}
 */
export async function updateThinking(chatId, thinking) {
    const key = `${KEY_PREFIX}${chatId}`;
    await redis.hset(key, 'thinking', thinking);
    await redis.expire(key, TTL);
}

/**
 * Adds a tool call to the list of active tools triggered by the model for a given chat in Redis.
 * Ensures duplicate tool names are not added.
 *
 * @param {string} chatId - Unique ID of the chat conversation.
 * @param {string} toolName - Name of the invoked tool (e.g. 'searchInternetTool').
 * @returns {Promise<void>}
 */
export async function addToolCall(chatId, toolName) {
    const key = `${KEY_PREFIX}${chatId}`;
    const existing = await redis.hget(key, 'toolCalls');
    let toolCalls = [];
    if (existing) {
        try {
            toolCalls = JSON.parse(existing);
        } catch (_err) {
            // Ignore parsing error and fallback to empty array
        }
    }
    if (!toolCalls.includes(toolName)) {
        toolCalls.push(toolName);
        await redis.hset(key, 'toolCalls', JSON.stringify(toolCalls));
    }
    await redis.expire(key, TTL);
}

/**
 * Retrieves the current status, thinking logs, and tool calls of an active stream for a chat.
 *
 * @param {string} chatId - Unique ID of the chat conversation.
 * @returns {Promise<{status: string, thinking: string, toolCalls: Array<string>} | null>}
 *          Returns the active stream metadata, or null if no stream is active.
 */
export async function getActiveStream(chatId) {
    const key = `${KEY_PREFIX}${chatId}`;
    const data = await redis.hgetall(key);
    if (!data || Object.keys(data).length === 0) return null;
    return {
        status: data.status,
        thinking: data.thinking || '',
        toolCalls: JSON.parse(data.toolCalls || '[]'),
    };
}

/**
 * Stops tracking and deletes the stream state from Redis when the stream concludes.
 *
 * @param {string} chatId - Unique ID of the chat conversation.
 * @returns {Promise<void>}
 */
export async function stopTracking(chatId) {
    const key = `${KEY_PREFIX}${chatId}`;
    await redis.del(key);
}
