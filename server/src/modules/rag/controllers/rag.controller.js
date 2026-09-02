import { createChunksBulk, getChunksByChunkIds, deleteAllChunks } from '../../../dao/chunk.dao.js';
import { uploadRagFileOnImageKit } from '../../../services/image.service.js';
import { createRagFile } from '../../../dao/ragFile.dao.js';
import { dataIngestion, deleteAllTheVectors } from '../../../rag/data-ingestion.rag.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * Save text chunks to the PostgreSQL database using Drizzle ORM.
 * Scopes chunks to either a global RAG document (ragFileId) or a user chat-specific document (fileId, chatId).
 *
 * @param {Object} params - Input parameters.
 * @param {Array<Object>} params.chunks - Chunks array from markdown processor.
 * @param {string} params.file - The UUID of the file/ragFile record.
 * @param {string} [params.chat] - The UUID of the chat session (for user files).
 * @param {string} [params.documentType] - Mimetype or format.
 * @param {string} [params.source] - Document source filename.
 * @param {boolean} [params.isGlobal] - Set to true for admin global uploads.
 * @returns {Promise<Array<Object>>} List of saved chunk representations.
 */
export async function saveChunksToDb({
    chunks,
    file,
    chat,
    documentType,
    source = 'unknown',
    isGlobal = false,
}) {
    try {
        if (!chunks || chunks.length === 0) {
            throw new Error('No chunks to save to database.');
        }

        const docsToInsert = chunks
            .filter((chunk) => chunk.text && chunk.text.trim().length > 0)
            .map((chunk) => {
                const data = {
                    text: chunk.text.trim(),
                    markdown: chunk.markdown ? chunk.markdown.trim() : '',
                    source: source,
                    metadata: chunk.metadata,
                    documentType,
                };
                if (isGlobal) {
                    data.ragFileId = file;
                    data.chatId = null;
                } else {
                    data.fileId = file;
                    data.chatId = chat;
                }
                return data;
            });

        if (docsToInsert.length === 0) {
            throw new Error('No valid non-empty chunk documents to insert.');
        }

        const insertedChunks = await createChunksBulk(docsToInsert);

        if (insertedChunks.length === 0) {
            throw new Error('No chunks were inserted.');
        }

        return insertedChunks.map((savedChunk) => ({
            id: savedChunk.id,
            fileId: isGlobal ? savedChunk.ragFileId : savedChunk.fileId,
            chatId: savedChunk.chatId,
            text: savedChunk.text,
            source: savedChunk.source,
            metadata: savedChunk.metadata,
            documentType: savedChunk.documentType,
        }));
    } catch (error) {
        console.error('Error in saveChunksToDb:', error.message || error);
        throw error;
    }
}

/**
 * Retrieve text chunks from the PostgreSQL database by their primary key UUIDs.
 * Securely filters chunks matching the specified chatId (if provided) and allows global chunks.
 *
 * @param {Array<string>} chunkIds - Array of chunk UUIDs.
 * @param {string} [chatId] - The active chat session UUID to scope retrieval.
 * @returns {Promise<Array<Object>>} List of matching chunk records.
 */
export async function retrieveChunksFromDb(chunkIds, chatId) {
    try {
        if (!chunkIds || chunkIds.length === 0) {
            return [];
        }

        const retrievedChunks = await getChunksByChunkIds(chunkIds);

        if (chatId) {
            return retrievedChunks.filter(
                (chunk) => chunk.chatId === chatId || chunk.chatId === null,
            );
        }

        return retrievedChunks;
    } catch (error) {
        console.error('Error in retrieveChunksFromDb:', error);
        return [];
    }
}

/**
 * Admin controller to upload and index global company documents.
 */
export async function adminUploadController(req, res) {
    try {
        if (!req.file) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'No file received. Send file under the "file" field.',
            });
        }

        const uploadedFile = await uploadRagFileOnImageKit(req.file);

        const ragFileRecord = await createRagFile({
            fileId: uploadedFile.fileId,
            name: uploadedFile.name,
            size: uploadedFile.size,
            filePath: uploadedFile.filePath || uploadedFile.name,
            url: uploadedFile.url,
            fileType: req.file.mimetype.startsWith('image/') ? 'image' : 'pdf',
            mimetype: req.file.mimetype,
            uploadedBy: req.user.id,
            processingStatus: 'completed',
            ragStatus: 'pending',
        });

        // Trigger data ingestion in background
        dataIngestion({
            fileUrl: ragFileRecord.url,
            file: ragFileRecord.id,
            chat: null,
            documentType: ragFileRecord.mimetype,
            source: ragFileRecord.name,
            isGlobal: true,
        }).catch((err) => {
            console.error('Background global ingestion error:', err);
        });

        return sendResponse({
            res,
            statusCode: 201,
            success: true,
            message: 'Company document uploaded and indexing initiated.',
            data: ragFileRecord,
        });
    } catch (error) {
        console.error('Error in adminUploadController:', error);
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'Failed to upload and index document.',
            error: error.message,
        });
    }
}

/**
 * Admin controller to clear all database chunks and vector indices.
 */
export async function adminClearChunksController(req, res) {
    try {
        await deleteAllChunks();
        await deleteAllTheVectors();

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'All database chunks and Pinecone vectors cleared successfully.',
        });
    } catch (error) {
        console.error('Error in adminClearChunksController:', error);
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'Failed to clear database chunks and vectors.',
            error: error.message,
        });
    }
}
