import { RefreshCw } from 'lucide-react';
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from '@/components/ai-elements/conversation/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message/message';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import './ChatViewport.scss';

/**
 * ChatViewport
 *
 * Props:
 *  - messages       { id, from, text }[]
 *  - isStreaming    boolean
 *  - selectedChatId string
 */
export default function ChatViewport({ messages, isStreaming, toolStatus, selectedChatId }) {
    return (
        <div className="chat-viewport">
            <Conversation chatId={selectedChatId} messagesCount={messages.length}>
                <ConversationContent>
                    {messages.length === 0 && !isStreaming && (
                        <div className="chat-viewport__empty">
                            <p>Start a conversation by typing a message below.</p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <Message key={msg.id} from={msg.from} className="my-2">
                            <MessageContent>
                                <MessageResponse>
                                    <MarkdownRenderer content={msg.text} />
                                </MessageResponse>
                            </MessageContent>
                        </Message>
                    ))}

                    {isStreaming && (
                        <Message from="assistant" className="my-2">
                            <MessageContent>
                                <div className="chat-viewport__thinking">
                                    <RefreshCw
                                        className="animate-spin"
                                        size={14}
                                        style={{ color: 'var(--color-blue-accent)' }}
                                    />
                                    <span>{toolStatus || 'Thinking…'}</span>
                                </div>
                            </MessageContent>
                        </Message>
                    )}
                </ConversationContent>

                <ConversationScrollButton />
            </Conversation>
        </div>
    );
}
