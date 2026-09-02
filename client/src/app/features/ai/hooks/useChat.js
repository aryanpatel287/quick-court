import { useCallback } from 'react';
import { useChatStore } from '../store/useChatStore';
import { chatStore } from '../store/chatStore';
import * as chatService from '../services/chat.service';
import { streamMessageResponse } from '../services/chatStream.service';

export function useChat() {
    const store = useChatStore();

    const selectConversation = useCallback(async (chatId) => {
        if (!chatId) return;

        chatStore.setSelectedChatId(chatId);
        chatStore.clearConversation();

        if (chatId.startsWith('new-')) {
            return;
        }

        try {
            const chatDetails = await chatService.getChatDetails(chatId);
            if (chatDetails && chatDetails.messages) {
                chatStore.setMessages(chatDetails.messages);
            }
        } catch (err) {
            console.error('Failed to load chat details:', err);
            chatStore.setError('Failed to load conversation history');
        }
    }, []);

    const newConversation = useCallback(() => {
        const tempId = `new-chat-${Date.now()}`;
        chatStore.setSelectedChatId(tempId);
        chatStore.clearConversation();
    }, []);

    const deleteConversation = useCallback(
        async (chatId) => {
            const { selectedChatId } = chatStore.getSnapshot();
            const isActive = chatId === selectedChatId;

            // Perform optimistic update in UI first
            chatStore.removeChat(chatId);

            // If the active chat was deleted, redirect to a new chat
            if (isActive) {
                newConversation();
            }

            // Send network request asynchronously in background
            try {
                if (!chatId.startsWith('new-')) {
                    await chatService.deleteChat(chatId);
                }
            } catch (err) {
                console.error('Failed to delete conversation:', err);
                chatStore.setError('Failed to delete conversation');
            }
        },
        [newConversation],
    );

    const renameConversation = useCallback(async (chatId, title) => {
        if (!title || !title.trim()) return;
        try {
            if (!chatId.startsWith('new-')) {
                await chatService.renameChat(chatId, title);
            }
            chatStore.renameChat(chatId, title);
        } catch (err) {
            console.error('Failed to rename conversation:', err);
            chatStore.setError('Failed to rename conversation');
        }
    }, []);

    const sendMessage = useCallback(async (text) => {
        const { selectedChatId, attachedFiles } = chatStore.getSnapshot();
        const trimmedText = text ? text.trim() : '';

        // Block if both are empty
        if (!trimmedText && attachedFiles.length === 0) return;

        // Clear local files in store immediately
        chatStore.setAttachedFiles([]);

        await streamMessageResponse(trimmedText, selectedChatId, attachedFiles);
    }, []);

    const stopStreaming = useCallback(() => {
        const { abortController } = chatStore.getSnapshot();
        if (abortController) {
            abortController.abort();
        }
    }, []);

    const retry = useCallback(async () => {
        const { messages, selectedChatId } = chatStore.getSnapshot();
        if (messages.length === 0) return;

        let lastUserMessageIdx = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].from === 'user') {
                lastUserMessageIdx = i;
                break;
            }
        }

        if (lastUserMessageIdx === -1) return;

        const lastUserMessageText = messages[lastUserMessageIdx].text;

        // Strip messages back to prior state
        const truncated = messages.slice(0, lastUserMessageIdx);
        chatStore.setMessages(
            truncated.map((msg) => ({
                id: msg.id,
                role: msg.from === 'assistant' ? 'ai' : msg.from,
                content: msg.text,
            })),
        );

        await streamMessageResponse(lastUserMessageText, selectedChatId, []);
    }, []);

    return {
        // Expose state snapshots
        messages: store.messages,
        chats: store.chats,
        selectedChatId: store.selectedChatId,
        isStreaming: store.isStreaming,
        toolStatus: store.toolStatus,
        error: store.error,

        // Expose methods
        selectConversation,
        deleteConversation,
        renameConversation,
        newConversation,
        sendMessage,
        stopStreaming,
        retry,
    };
}
