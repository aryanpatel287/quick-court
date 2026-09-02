import { useEffect, useState, useCallback } from 'react';
import './AiChat.scss';
import ConversationSidebar from './components/ConversationSidebar/ConversationSidebar';
import ChatViewport from './components/ChatViewport/ChatViewport';
import ChatInputBar from './components/ChatInputBar/ChatInputBar';
import { useChat } from './hooks/useChat';
import { chatStore } from './store/chatStore';
import * as chatService from './services/chat.service';

export default function AiChat() {
    const {
        messages,
        chats,
        selectedChatId,
        isStreaming,
        toolStatus,
        error,
        selectConversation,
        deleteConversation,
        renameConversation,
        newConversation,
        sendMessage,
    } = useChat();

    const [inputText, setInputText] = useState('');

    // Fetch initial chat list on mount
    useEffect(() => {
        let isMounted = true;
        async function loadInitialChats() {
            try {
                const list = await chatService.getChats();
                if (isMounted) {
                    chatStore.setChats(list);
                    newConversation();
                }
            } catch (err) {
                console.error('Failed to load initial chats:', err);
            }
        }
        loadInitialChats();
        return () => {
            isMounted = false;
        };
    }, [newConversation]);

    const handleSelectConv = useCallback(
        (id) => {
            selectConversation(id);
            setInputText('');
        },
        [selectConversation],
    );

    const handleSendMessage = useCallback(
        (text) => {
            console.log('function called : ' + text);
            const trimmed = (typeof text === 'string' ? text : inputText).trim();
            if (!trimmed) return;
            sendMessage(trimmed);
            setInputText('');
        },
        [sendMessage, inputText],
    );

    const handleDeleteConv = useCallback(
        (e, id) => {
            e.stopPropagation();
            deleteConversation(id);
        },
        [deleteConversation],
    );

    return (
        <div className="ai-chat-container">
            {error && (
                <div className="ai-chat-error-toast">
                    <span>{error}</span>
                    <button type="button" onClick={() => chatStore.setError(null)}>
                        ✕
                    </button>
                </div>
            )}

            <ConversationSidebar
                conversations={chats}
                activeConvId={selectedChatId}
                onSelect={handleSelectConv}
                onNew={newConversation}
                onDelete={handleDeleteConv}
                onRename={renameConversation}
            />

            <div className="ai-chat-workspace">
                <ChatViewport
                    messages={messages}
                    isStreaming={isStreaming}
                    toolStatus={toolStatus}
                    selectedChatId={selectedChatId}
                />

                <ChatInputBar
                    inputText={inputText}
                    onInputChange={setInputText}
                    onSend={handleSendMessage}
                    isStreaming={isStreaming}
                />
            </div>
        </div>
    );
}
