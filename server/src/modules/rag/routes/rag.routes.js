import { Router } from 'express';
import multer from 'multer';
import { protect, restrictTo } from '../../auth/index.js';
import {
    adminUploadController,
    adminClearChunksController,
} from '../controllers/rag.controller.js';

const upload = multer({ storage: multer.memoryStorage() });
const ragRouter = Router();

/**
 * @route POST /api/rag/admin/upload
 * @description Admin uploads a global company document for RAG indexing
 * @access Private (Admin Only)
 */
ragRouter.post(
    '/admin/upload',
    protect,
    restrictTo('admin'),
    upload.single('file'),
    adminUploadController,
);

/**
 * @route DELETE /api/rag/admin/chunks
 * @description Admin clears all indexed chunks and vector stores
 * @access Private (Admin Only)
 */
ragRouter.delete('/admin/chunks', protect, restrictTo('admin'), adminClearChunksController);

export default ragRouter;
