import {
    createChat,
    getChatById,
    listChatsByUserId,
    updateChat,
    deleteChat,
} from '../../../dao/chat.dao.js';
import { createMessage, listMessagesByChatId } from '../../../dao/message.dao.js';
import {
    generateResponse,
    generateChatTitle,
    streamAiResponse,
    summariseFileWithAi,
} from '../../../services/ai/response.ai.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';
import { uploadMultipleImagesOnImageKit } from '../../../services/image.service.js';
import { createFilesBulk } from '../../../dao/file.dao.js';
import { dataIngestion } from '../../../rag/data-ingestion.rag.js';
import parseDocumentsByLlama from '../../../rag/llama-parser.rag.js';

const generateChatResponseController = async (req, res) => {
    try {
        const { message, chatId } = req.body;
        const user = req.user;

        let chat = null;
        const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

        if (!chatId || chatId === 'null' || chatId === 'undefined') {
            const chatTitle = await generateChatTitle(message);
            chat = await createChat({
                userId: user.id,
                title: chatTitle,
            });
        } else {
            if (!uuidRegex.test(chatId)) {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'Invalid chat ID format',
                    data: null,
                });
            }
            chat = await getChatById(chatId);
            if (!chat) {
                return sendResponse({
                    res,
                    statusCode: 404,
                    success: false,
                    message: 'Chat not found',
                    data: null,
                });
            }
        }

        await createMessage({
            chatId: chat.id,
            content: message,
            role: 'user',
        });

        const messageHistory = await listMessagesByChatId(chat.id);

        const response = await generateResponse(messageHistory);

        const aiResponse = await createMessage({
            chatId: chat.id,
            content: response,
            role: 'ai',
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Resposne Generated Successfully',
            success: true,
            aiResponse,
        });
    } catch (error) {
        console.log(error);
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'Failed to generate chat response',
            error: error.message,
        });
    }
};

const getUserChatsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const chatsList = await listChatsByUserId(userId);
        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Chats retrieved successfully',
            chats: chatsList,
        });
    } catch (error) {
        console.log(error);
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'Failed to retrieve chats',
            error: error.message,
        });
    }
};

const getChatDetailsController = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;
        const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

        if (!uuidRegex.test(chatId)) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'Invalid chat ID format',
                chat: null,
            });
        }

        const chat = await getChatById(chatId);
        if (!chat || chat.userId !== userId) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'Chat not found',
                chat: null,
            });
        }

        const messagesList = await listMessagesByChatId(chatId);

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Chat details retrieved successfully',
            chat: {
                ...chat,
                messages: messagesList,
            },
        });
    } catch (error) {
        console.log(error);
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'Failed to retrieve chat details',
            chat: null,
            error: error.message,
        });
    }
};

const streamChatController = async (req, res) => {
    try {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const { message, chatId, uploadedFiles } = req.body;
        const user = req.user;

        let chat = null;
        const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

        if (!chatId || chatId === 'null' || chatId === 'undefined') {
            const chatTitle = await generateChatTitle(message);
            chat = await createChat({
                userId: user.id,
                title: chatTitle,
            });
            res.write(
                `data: ${JSON.stringify({
                    event: 'chat_created',
                    data: { chatId: chat.id, title: chat.title },
                })}\n\n`,
            );
        } else {
            if (!uuidRegex.test(chatId)) {
                res.write(
                    `data: ${JSON.stringify({
                        event: 'error',
                        data: 'Invalid chat ID format',
                    })}\n\n`,
                );
                return res.end();
            }
            chat = await getChatById(chatId);
            if (!chat) {
                res.write(
                    `data: ${JSON.stringify({
                        event: 'error',
                        data: 'Chat not found',
                    })}\n\n`,
                );
                return res.end();
            }
            if (chat.userId !== user.id) {
                res.write(
                    `data: ${JSON.stringify({
                        event: 'error',
                        data: 'Unauthorized access to chat session',
                    })}\n\n`,
                );
                return res.end();
            }
        }

        const userMessage = await createMessage({
            chatId: chat.id,
            content: message,
            role: 'user',
        });

        let userFiles = [];
        if (uploadedFiles?.length) {
            userFiles = await processFiles({
                uploadedFiles,
                userMessageId: userMessage.id,
                userId: user.id,
                resolvedChatId: chat.id,
            });
        }

        const messageHistory = await listMessagesByChatId(chat.id);

        let isDisconnected = false;
        req.on('close', () => {
            isDisconnected = true;
            console.log(
                `Client disconnected from stream for chat ${chat.id}. Completing generation in background.`,
            );
        });

        const safeWrite = (data) => {
            if (!isDisconnected && !res.destroyed && res.writable) {
                try {
                    res.write(data);
                } catch (err) {
                    console.error('Error writing to SSE stream:', err.message);
                }
            }
        };

        const onToolCall = async (toolCallEvent) => {
            let userFriendlyMessage;
            const args = toolCallEvent.args || {};

            if (toolCallEvent.event === 'tool_start') {
                if (toolCallEvent.tool === 'searchInternetTool') {
                    userFriendlyMessage = `Searching Internet: "${args.input || ''}"`;
                } else if (toolCallEvent.tool === 'emailTool') {
                    userFriendlyMessage = `Sending Email Notification: "${args.subject || ''}"`;
                } else if (toolCallEvent.tool === 'contextRetrieverTool') {
                    userFriendlyMessage = `Searching Knowledge Base: "${args.query || ''}"`;
                } else if (toolCallEvent.tool === 'getCurrentDateTimeTool') {
                    userFriendlyMessage = `Checking Current Date and Time`;
                } else {
                    userFriendlyMessage = `Executing ${toolCallEvent.tool}`;
                }

                safeWrite(
                    `data: ${JSON.stringify({
                        role: 'ai',
                        event: 'tool_start',
                        data: userFriendlyMessage,
                    })}\n\n`,
                );
            } else if (toolCallEvent.event === 'tool_end') {
                if (toolCallEvent.tool === 'searchInternetTool') {
                    userFriendlyMessage = `✓ Search Finished`;
                } else if (toolCallEvent.tool === 'emailTool') {
                    userFriendlyMessage = `✓ Email Sent Successfully`;
                } else if (toolCallEvent.tool === 'contextRetrieverTool') {
                    userFriendlyMessage = `✓ Knowledge Base Search Finished`;
                } else if (toolCallEvent.tool === 'getCurrentDateTimeTool') {
                    userFriendlyMessage = `✓ Checked Date and Time`;
                } else {
                    userFriendlyMessage = `✓ Finished executing ${toolCallEvent.tool}`;
                }

                safeWrite(
                    `data: ${JSON.stringify({
                        role: 'ai',
                        event: 'tool_end',
                        data: userFriendlyMessage,
                    })}\n\n`,
                );
            }
        };

        const onToken = async (content) => {
            safeWrite(
                `data: ${JSON.stringify({
                    role: 'ai',
                    event: 'token',
                    data: content,
                })}\n\n`,
            );
        };

        const finalText = await streamAiResponse(messageHistory, userFiles, {
            onToolCall,
            onToken,
            chatId: chat.id,
        });

        await createMessage({
            chatId: chat.id,
            content: finalText,
            role: 'ai',
        });

        safeWrite(
            `data: ${JSON.stringify({
                role: 'ai',
                event: 'end',
                data: '',
            })}\n\n`,
        );
        res.end();
    } catch (error) {
        console.error('Error in streamChatController:', error);
        if (!res.headersSent) {
            return sendResponse({
                res,
                statusCode: 500,
                success: false,
                message: 'Failed to stream chat',
                error: error.message,
            });
        } else {
            res.end();
        }
    }
};

function isPlainTextFile(file) {
    const name = file.name?.toLowerCase() || '';
    const mime = file.mimetype?.toLowerCase() || '';
    return (
        mime.startsWith('text/') ||
        mime === 'application/json' ||
        mime === 'application/javascript' ||
        mime === 'application/x-javascript' ||
        mime === 'application/xml' ||
        name.endsWith('.md') ||
        name.endsWith('.markdown') ||
        name.endsWith('.txt') ||
        name.endsWith('.json') ||
        name.endsWith('.csv') ||
        name.endsWith('.tsv') ||
        name.endsWith('.xml') ||
        name.endsWith('.yaml') ||
        name.endsWith('.yml') ||
        name.endsWith('.ini') ||
        name.endsWith('.conf') ||
        name.endsWith('.js') ||
        name.endsWith('.ts') ||
        name.endsWith('.jsx') ||
        name.endsWith('.tsx')
    );
}

async function processFiles({ uploadedFiles, userMessageId, userId, resolvedChatId }) {
    if (!uploadedFiles || !uploadedFiles.length) return [];

    try {
        const processed = await Promise.all(
            uploadedFiles.map(async (file) => {
                try {
                    if (file.mimetype?.startsWith('image/')) {
                        return {
                            ...file,
                            metadata: {},
                            processingStatus: 'completed',
                            isImage: true,
                        };
                    }

                    const isPlain = isPlainTextFile(file);
                    let parsedFile;

                    if (isPlain) {
                        const response = await fetch(file.url);
                        if (!response.ok) {
                            throw new Error(`Failed to fetch plain text file from ${file.url}`);
                        }
                        const textContent = await response.text();
                        parsedFile = {
                            ...file,
                            markdown_full: textContent,
                            markdown: {
                                pages: [{ page_number: 1, markdown: textContent }],
                            },
                        };
                    } else {
                        const data = await parseDocumentsByLlama(file.url);
                        parsedFile = {
                            ...file,
                            markdown_full: data.markdown_full,
                            markdown: data.markdown,
                        };
                    }

                    const summarisedContent = await summariseFileWithAi(parsedFile);
                    return {
                        ...parsedFile,
                        metadata: summarisedContent,
                        processingStatus: 'completed',
                        isImage: false,
                    };
                } catch (fileError) {
                    console.error(`Failed parsing file ${file.name}:`, fileError);
                    return {
                        ...file,
                        metadata: {},
                        processingStatus: 'failed',
                        isImage: false,
                    };
                }
            }),
        );

        const filesToCreate = processed.map((file) => ({
            fileId: file.fileId,
            name: file.name,
            size: file.size,
            filePath: file.filePath || file.name,
            url: file.url,
            fileType: file.mimetype?.startsWith('image/') ? 'image' : 'pdf',
            mimetype: file.mimetype,
            messageId: userMessageId,
            uploadedBy: userId,
            metadata: file.metadata || {},
            processingStatus: file.processingStatus,
        }));

        const createdFiles = await createFilesBulk(filesToCreate);

        createdFiles.forEach((dbFile, index) => {
            const parsedFile = processed[index];
            if (parsedFile.isImage || parsedFile.processingStatus === 'failed') return;

            void dataIngestion({
                fileUrl: dbFile.url,
                file: dbFile.id,
                chat: resolvedChatId,
                documentType: dbFile.mimetype,
                source: dbFile.name,
                markdownContent: parsedFile.markdown,
                isGlobal: false,
            });
        });

        return createdFiles;
    } catch (dbError) {
        console.error('Error saving files to DB:', dbError);
        const filesToCreate = uploadedFiles.map((file) => ({
            fileId: file.fileId,
            name: file.name,
            size: file.size,
            filePath: file.filePath || file.name,
            url: file.url,
            fileType: file.mimetype?.startsWith('image/') ? 'image' : 'pdf',
            mimetype: file.mimetype,
            messageId: userMessageId,
            uploadedBy: userId,
            processingStatus: 'failed',
        }));
        return await createFilesBulk(filesToCreate);
    }
}

const uploadFileController = async (req, res) => {
    try {
        if (!req.files?.length) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'No files received. Send files under the "files" field.',
            });
        }

        const uploadedFiles = await uploadMultipleImagesOnImageKit(req.files);

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Files uploaded successfully',
            uploadedFiles,
        });
    } catch (err) {
        console.error('File upload error:', err);
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'File upload failed',
            error: err.message,
        });
    }
};

const renameChatController = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { title } = req.body;
        const userId = req.user.id;
        const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

        if (!uuidRegex.test(chatId)) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'Invalid chat ID format',
                chat: null,
            });
        }

        const chat = await getChatById(chatId);
        if (!chat || chat.userId !== userId) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'Chat not found',
                chat: null,
            });
        }

        const updatedChat = await updateChat(chatId, { title });

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Chat renamed successfully',
            chat: updatedChat,
        });
    } catch (error) {
        console.log(error);
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'Failed to rename chat',
            chat: null,
            error: error.message,
        });
    }
};

const deleteChatController = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;
        const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

        if (!uuidRegex.test(chatId)) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'Invalid chat ID format',
            });
        }

        const chat = await getChatById(chatId);
        if (!chat || chat.userId !== userId) {
            return sendResponse({
                res,
                statusCode: 404,
                success: false,
                message: 'Chat not found',
            });
        }

        await deleteChat(chatId);

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Chat deleted successfully',
        });
    } catch (error) {
        console.log(error);
        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'Failed to delete chat',
            error: error.message,
        });
    }
};

export {
    generateChatResponseController,
    getUserChatsController,
    getChatDetailsController,
    streamChatController,
    uploadFileController,
    renameChatController,
    deleteChatController,
};
