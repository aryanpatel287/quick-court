import { chatStore } from '../store/chatStore';

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function streamMessageResponse(messageText, chatId, uploadedFiles = []) {
    const storeState = chatStore.getSnapshot();
    if (storeState.isStreaming) return;

    const abortController = new AbortController();
    chatStore.setAbortController(abortController);
    chatStore.setStreaming(true);
    chatStore.setError(null);
    chatStore.setToolStatus(null);

    // Generate temporary IDs for messages
    const userMsgId = `msg-user-${Date.now()}`;
    const assistantMsgId = `msg-assistant-${Date.now()}`;

    // Add user message locally
    chatStore.addUserMessage({
        id: userMsgId,
        role: 'user',
        content: messageText,
        createdAt: new Date().toISOString(),
    });

    const isNewChat = !chatId || !uuidRegex.test(chatId);
    const bodyChatId = isNewChat ? null : chatId;

    try {
        const response = await fetch('/api/ai/chat/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: messageText,
                chatId: bodyChatId,
                uploadedFiles: uploadedFiles.map((f) => ({
                    fileId: f.fileId,
                    name: f.name,
                    size: f.size,
                    filePath: f.filePath || f.name,
                    url: f.url,
                    fileType: f.fileType,
                    mimetype: f.mimetype,
                })),
            }),
            signal: abortController.signal,
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || `Server returned status code ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let hasAddedAssistantPlaceholder = false;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const cleanLine = line.trim();
                if (!cleanLine) continue;

                if (cleanLine.startsWith('data: ')) {
                    const dataStr = cleanLine.slice(6);
                    if (dataStr === '[DONE]') {
                        continue;
                    }

                    try {
                        const parsed = JSON.parse(dataStr);

                        // Normalize events
                        if (parsed.event === 'chat_created') {
                            const newChat = parsed.data; // { chatId, title }
                            // Update store selection and rename chat in list
                            chatStore.updateChatSession(chatId, newChat.chatId, newChat.title);
                            chatId = newChat.chatId; // Update local tracker
                        } else if (parsed.event === 'tool_start') {
                            chatStore.startTool(parsed.data);
                        } else if (parsed.event === 'tool_end') {
                            chatStore.finishTool();
                        } else if (parsed.event === 'token') {
                            if (!hasAddedAssistantPlaceholder) {
                                chatStore.addAssistantMessage({
                                    id: assistantMsgId,
                                    role: 'ai',
                                    content: '',
                                    createdAt: new Date().toISOString(),
                                });
                                hasAddedAssistantPlaceholder = true;
                            }
                            chatStore.appendAssistantToken(parsed.data);
                        } else if (parsed.event === 'end') {
                            // SSE completed successfully
                            break;
                        } else if (parsed.event === 'error') {
                            throw new Error(parsed.data || 'Error occurred during streaming');
                        }
                    } catch (jsonErr) {
                        console.error('Error parsing SSE line:', jsonErr, cleanLine);
                    }
                }
            }
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            console.log('Stream generation aborted by user');
        } else {
            console.error('Streaming response failed:', err);
            chatStore.setError(err.message || 'Stream processing failed');
        }
    } finally {
        chatStore.setStreaming(false);
        chatStore.setAbortController(null);
        chatStore.finishTool();
    }
}
