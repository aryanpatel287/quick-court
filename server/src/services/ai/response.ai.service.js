import { AIMessage, HumanMessage, SystemMessage } from 'langchain';
import {
    mistralModel,
    geminiSummariseAgent,
    getGeminiAgent,
    getGeminiFallbackAgent,
    geminiAgent,
} from './models.ai.service.js';

/**
 * Generates a one-off non-streaming AI response using the Mistral Agent.
 *
 * @param {Array<{role: string, content: string}>} messages - Array of chat messages in { role, content } format.
 * @param {string} [_chatId] - The ID of the current chat session to scope search context.
 * @returns {Promise<string>} The text content of the final AI message.
 */
export async function generateResponse(messages, _chatId) {
    const mappedMessages = messages.map((message) => {
        if (message.role == 'user') return new HumanMessage(message.content);
        if (message.role == 'ai') return new AIMessage(message.content);
    });

    const agent = geminiAgent;
    const response = await agent.invoke({ messages: mappedMessages });
    return response.messages[response.messages.length - 1].text;
}

/**
 * Generates a brief, descriptive 2-4 word title for a new chat conversation.
 *
 * @param {string} message - The first message of the chat conversation.
 * @returns {Promise<string>} Concise chat title (plain text, no markdown).
 */
export async function generateChatTitle(message) {
    const response = await mistralModel.invoke([
        new SystemMessage(`You are a helpful assistant that generates concise and descriptive titles for chat conversations. 
		User will provide you the first message of a chat conversation, your task is to create a title that accurately reflects the main topic or theme of the conversation. The title should be brief, ideally no more than 2-4 words, and should capture the essence of the discussion in a clear and engaging way.Return a title as normal string not markdown    
			`),
        new HumanMessage(
            `Generate a concise and descriptive title for a chat conversation based on the following message:
			"${message}". `,
        ),
    ]);

    return response.text;
}

/**
 * Formats a file's metadata into a user-facing system message snippet.
 * This instructs the LLM on how the file is indexed and references the contextRetrieverTool.
 *
 * @param {Object} file - The file object with its metadata.
 * @returns {string} Formatted markdown system context block.
 * @private
 */
function formatFileMetadata(file) {
    const metadata = file.metadata || {};
    let context = `\n\n---`;
    context += `\n### [Attached Document: ${file.name}]`;
    if (metadata.title) context += `\n- **Title:** ${metadata.title}`;
    if (metadata.summary) context += `\n- **Summary:** ${metadata.summary}`;
    if (metadata.suggestedSystemContext)
        context += `\n- **Context:** ${metadata.suggestedSystemContext}`;

    if (Array.isArray(metadata.sections) && metadata.sections.length > 0) {
        context += `\n- **Key Sections:** ${metadata.sections.join(', ')}`;
    }
    if (Array.isArray(metadata.keywords) && metadata.keywords.length > 0) {
        context += `\n- **Keywords:** ${metadata.keywords.join(', ')}`;
    }

    context += `\n*Note: The complete text of this document has been indexed and is searchable. If you need to retrieve specific details, direct quotes, or deep context from this document, use the \`contextRetrieverTool\`.*`;
    return context;
}

/**
 * Consumes the agent stream chunks, firing callbacks on thinking/tool use and aggregating final text.
 *
 * @param {AsyncIterable} stream - The streaming payload generator from LangChain.
 * @param {Object} [callbacks] - Optional stream event handlers.
 * @param {Function} [callbacks.onToolCall] - Called with the tool name (e.g. 'emailTool').
 * @param {Function} [callbacks.onToken] - Called when a new token is generated.
 * @returns {Promise<string>} The full accumulated final response text.
 * @private
 */
async function consumeStream(stream, { onToolCall, onToken } = {}) {
    let finalText = '';

    for await (const chunk of stream) {
        if (!Array.isArray(chunk) || chunk.length < 2) {
            continue;
        }

        const [streamModeType, payload] = chunk;

        if (streamModeType === 'messages') {
            const message = Array.isArray(payload) ? payload[0] : payload;
            if (!message) continue;

            // Ignore ToolMessages from streaming as tokens
            if (
                message.type === 'tool' ||
                message.constructor.name === 'ToolMessage' ||
                (message.id && message.id.includes('ToolMessage'))
            ) {
                continue;
            }

            // Process model tool call start
            if (message.tool_calls && message.tool_calls.length > 0) {
                if (onToolCall) {
                    message.tool_calls.forEach((t) => {
                        onToolCall({
                            event: 'tool_start',
                            tool: t.name,
                            id: t.id,
                            args: t.args,
                        });
                    });
                }
                continue;
            }

            // Extract content text while ignoring thinking blocks
            const content = message.content;
            if (typeof content === 'string' && content) {
                finalText += content;
                if (onToken) {
                    onToken(content);
                }
            } else if (Array.isArray(content)) {
                for (const part of content) {
                    if (part.type === 'text') {
                        if (!part.thought && part.text) {
                            finalText += part.text;
                            if (onToken) {
                                onToken(part.text);
                            }
                        }
                    }
                }
            }
        } else if (streamModeType === 'updates') {
            // Check if update is from the tools node
            if (payload && payload.tools && payload.tools.messages) {
                const messagesList = payload.tools.messages;
                if (onToolCall) {
                    messagesList.forEach((msg) => {
                        if (
                            msg.type === 'constructor' &&
                            msg.id &&
                            msg.id.includes('ToolMessage')
                        ) {
                            const kwargs = msg.kwargs || {};
                            onToolCall({
                                event: 'tool_end',
                                tool: kwargs.name,
                                id: kwargs.tool_call_id,
                                result: kwargs.content,
                            });
                        } else if (msg.tool_call_id || (msg.kwargs && msg.kwargs.tool_call_id)) {
                            const kwargs = msg.kwargs || msg;
                            onToolCall({
                                event: 'tool_end',
                                tool: kwargs.name,
                                id: kwargs.tool_call_id,
                                result: kwargs.content,
                            });
                        }
                    });
                }
            }
        }
    }

    return finalText;
}

/**
 * Streams the AI agent response for a given message history and list of user-attached files.
 * Falls back to Gemini-Flash model if the primary Gemma model fails.
 *
 * @param {Array<{role: string, content: string}>} messageHistory - The chat message history.
 * @param {Array<Object>|string} userFilesOrChatId - List of user-uploaded files to reference or index, or the active chatId.
 * @param {Object} [optionsOrUndefined] - Stream hooks and context scoping.
 * @param {Function} [optionsOrUndefined.onToolCall] - Called when the agent triggers external tool calls.
 * @param {Function} [optionsOrUndefined.onToken] - Called when a new token is generated.
 * @param {string} [optionsOrUndefined.chatId] - Current active chat ID to scope search vector queries.
 * @returns {Promise<string>} Resolves with the fully assembled response string.
 */
export async function streamAiResponse(messageHistory, userFilesOrChatId, optionsOrUndefined) {
    let userFiles = [];
    let options;

    if (typeof userFilesOrChatId === 'string') {
        options = optionsOrUndefined || {};
        options.chatId = userFilesOrChatId;
    } else {
        userFiles = userFilesOrChatId;
        options = optionsOrUndefined || {};
    }

    const { onToolCall, onToken, chatId } = options;
    const lastIndex = messageHistory.length - 1;

    const mappedMessages = messageHistory
        .map((message, index) => {
            if (message.role === 'user') {
                const content = [{ type: 'text', text: message.content }];

                // If this is the last user message, attach file contextual summaries
                if (index === lastIndex && Array.isArray(userFiles) && userFiles.length) {
                    let docContexts = '';
                    for (const file of userFiles) {
                        if (file.mimetype?.startsWith('image/')) {
                            content.push({ type: 'image', url: file.url });
                        } else {
                            docContexts += formatFileMetadata(file);
                        }
                    }
                    if (docContexts) {
                        content[0].text += docContexts;
                    }
                }

                return new HumanMessage({ role: 'user', content });
            }

            if (message.role === 'ai') {
                return new AIMessage(message.content);
            }

            return null;
        })
        .filter(Boolean);

    try {
        const agent = getGeminiAgent(chatId);
        const stream = await agent.stream(
            {
                messages: mappedMessages,
            },
            { streamMode: ['messages', 'updates'] },
        );
        return await consumeStream(stream, { onToolCall, onToken });
    } catch (err) {
        console.warn(`Primary Gemma model failed: ${err.message}. Falling back to Gemini...`);

        const fallbackAgent = getGeminiFallbackAgent(chatId);
        const fallbackStream = await fallbackAgent.stream(
            {
                messages: mappedMessages,
            },
            { streamMode: ['messages', 'updates'] },
        );
        return await consumeStream(fallbackStream, { onToolCall, onToken });
    }
}

/**
 * Summarizes document markdown content using Gemini, structured against DocumentSummaryStructure.
 *
 * @param {Object} file - File object to summarize.
 * @param {string} file.markdown_full - Entire markdown string content of the document.
 * @returns {Promise<Object>} Resolves to a structured object matching DocumentSummaryStructure schema.
 */
export async function summariseFileWithAi(file) {
    if (!file) {
        throw new Error('File not found');
    }

    const result = await geminiSummariseAgent.invoke({
        messages: [
            new SystemMessage(
                `You are a helpful assistant that summarises documents. 
                 Your task is to create a summary of the document that accurately reflects the main topic or theme of the document.
                 The summary should be brief, ideally no more than 200 words, and should capture the essence of the document in a clear and engaging way.
                 Return a summary as normal string not markdownAnalyze the provided document and populate the schema.

                Guidelines:
                - Use only document content.
                - Do not hallucinate or infer unsupported information.
                - Keep summaries concise and information-dense.
                - Generate realistic retrieval queries.
                - suggestedSystemContext should help an AI understand the document quickly.

                Return output that strictly matches the schema.`,
            ),
            new HumanMessage(
                `Generate the summary of the following markdown content: 
			${file.markdown_full}
			`,
            ),
        ],
    });

    return result.structuredResponse;
}
