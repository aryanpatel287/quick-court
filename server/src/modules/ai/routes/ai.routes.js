import { Router } from 'express';
import multer from 'multer';
import {
    generateChatResponseController,
    getUserChatsController,
    getChatDetailsController,
    streamChatController,
    uploadFileController,
    renameChatController,
    deleteChatController,
} from '../controllers/ai.controller.js';
import { protect } from '../../auth/index.js';

const upload = multer({ storage: multer.memoryStorage() });
const aiRouter = Router();

/**
 * @route POST /api/ai/chat/stream
 * @description Stream AI responses
 * @access Private
 */
aiRouter.post('/chat/stream', protect, streamChatController);

/**
 * @route POST /api/ai/chat/once
 * @description Get one-off non-streaming AI response
 * @access Private
 */
aiRouter.post('/chat/once', protect, generateChatResponseController);

/**
 * @route GET /api/ai/chats
 * @description Get all chats for the authenticated user
 * @access Private
 */
aiRouter.get('/chats', protect, getUserChatsController);

/**
 * @route GET /api/ai/chats/:chatId
 * @description Get a specific chat with its messages
 * @access Private
 */
aiRouter.get('/chats/:chatId', protect, getChatDetailsController);

/**
 * @route PATCH /api/ai/chats/:chatId
 * @description Rename a specific chat title
 * @access Private
 */
aiRouter.patch('/chats/:chatId', protect, renameChatController);

/**
 * @route DELETE /api/ai/chats/:chatId
 * @description Delete a specific chat session
 * @access Private
 */
aiRouter.delete('/chats/:chatId', protect, deleteChatController);

/**
 * @route POST /api/ai/chat/upload
 * @description Upload chat attachment files directly to ImageKit
 * @access Private
 */
aiRouter.post('/chat/upload', protect, upload.array('files'), uploadFileController);

export default aiRouter;
