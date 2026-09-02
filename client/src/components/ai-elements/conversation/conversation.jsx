'use client';

import Button from '@/components/Shared/Buttons/Button/Button';
import { cn } from '@/lib/utils';
import { ArrowDownIcon } from 'lucide-react';
import {
    createContext,
    useContext,
    useRef,
    useEffect,
    useCallback,
    useState,
    Children,
} from 'react';
import './conversation.scss';

const ConversationContext = createContext({
    isAtBottom: true,
    scrollToBottom: () => {},
});

export const Conversation = ({ className, children, chatId, messagesCount, ...props }) => {
    const containerRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const isAtBottomRef = useRef(true);

    const prevChatId = useRef(chatId);
    const prevMessagesCount = useRef(messagesCount);

    const scrollToBottom = useCallback(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, []);

    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        // Check if user is scrolled within 30px of bottom
        const atBottom = scrollHeight - scrollTop - clientHeight < 30;
        setIsAtBottom(atBottom);
        isAtBottomRef.current = atBottom;
    }, []);

    useEffect(() => {
        const isNewChat = chatId !== prevChatId.current;
        const hasNewMessage = messagesCount > prevMessagesCount.current;

        prevChatId.current = chatId;
        prevMessagesCount.current = messagesCount;

        if (isNewChat || hasNewMessage || isAtBottomRef.current) {
            scrollToBottom();
        }
    }, [children, chatId, messagesCount, scrollToBottom]);

    const childrenArray = Children.toArray(children);
    const scrollButton = childrenArray.find((child) => child.type === ConversationScrollButton);
    const otherChildren = childrenArray.filter((child) => child.type !== ConversationScrollButton);

    return (
        <ConversationContext.Provider value={{ isAtBottom, scrollToBottom }}>
            <div
                className="ai-conversation-container"
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div
                    ref={containerRef}
                    className={cn('ai-conversation', className)}
                    onScroll={handleScroll}
                    role="log"
                    style={{ overflowY: 'auto', flex: 1 }}
                    {...props}
                >
                    {otherChildren}
                </div>
                {scrollButton}
            </div>
        </ConversationContext.Provider>
    );
};

export const ConversationContent = ({ className, ...props }) => (
    <div className={cn('ai-conversation-content', className)} {...props} />
);

export const ConversationEmptyState = ({
    className,
    title = 'No messages yet',
    description = 'Start a conversation to see messages here',
    icon,
    children,
    ...props
}) => (
    <div className={cn('ai-conversation-empty-state', className)} {...props}>
        {children ?? (
            <>
                {icon && <div className="ai-conversation-empty-icon">{icon}</div>}
                <div className="ai-conversation-empty-info">
                    <h3 className="ai-conversation-empty-title">{title}</h3>
                    {description && <p className="ai-conversation-empty-desc">{description}</p>}
                </div>
            </>
        )}
    </div>
);

export const ConversationScrollButton = ({ className, ...props }) => {
    const { isAtBottom, scrollToBottom } = useContext(ConversationContext);

    return (
        !isAtBottom && (
            <Button
                className={cn('ai-conversation-scroll-btn', className)}
                onClick={scrollToBottom}
                size="icon"
                circle
                type="button"
                variant="secondary"
                aria-label="Scroll to bottom"
                {...props}
            >
                <ArrowDownIcon size={16} />
            </Button>
        )
    );
};
