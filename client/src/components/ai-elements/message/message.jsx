'use client';

import Button from '@/components/Shared/Buttons/Button/Button';
import Tooltip from '@/components/Shared/DataDisplay/Tooltip/Tooltip';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { createContext, memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import './message.scss';

export const Message = ({ className, from, ...props }) => (
    <div
        className={cn('ai-message', from === 'user' ? 'is-user' : 'is-assistant', className)}
        {...props}
    />
);

export const MessageContent = ({ children, className, ...props }) => (
    <div className={cn('ai-message-content', className)} {...props}>
        {children}
    </div>
);

export const MessageActions = ({ className, children, ...props }) => (
    <div className={cn('ai-message-actions', className)} {...props}>
        {children}
    </div>
);

export const MessageAction = ({
    tooltip,
    children,
    label,
    variant = 'ghost',
    size = 'icon-sm',
    ...props
}) => {
    const button = (
        <Button size={size} type="button" variant={variant} {...props}>
            {children}
            <span className="sr-only">{label || tooltip}</span>
        </Button>
    );

    if (tooltip) {
        return (
            <Tooltip content={tooltip} position="top" usePortal>
                {button}
            </Tooltip>
        );
    }

    return button;
};

const MessageBranchContext = createContext(null);

const useMessageBranch = () => {
    const context = useContext(MessageBranchContext);

    if (!context) {
        throw new Error('MessageBranch components must be used within MessageBranch');
    }

    return context;
};

export const MessageBranch = ({ defaultBranch = 0, onBranchChange, className, ...props }) => {
    const [currentBranch, setCurrentBranch] = useState(defaultBranch);
    const [branches, setBranches] = useState([]);

    const handleBranchChange = useCallback(
        (newBranch) => {
            setCurrentBranch(newBranch);
            onBranchChange?.(newBranch);
        },
        [onBranchChange],
    );

    const goToPrevious = useCallback(() => {
        const newBranch = currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
        handleBranchChange(newBranch);
    }, [currentBranch, branches.length, handleBranchChange]);

    const goToNext = useCallback(() => {
        const newBranch = currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
        handleBranchChange(newBranch);
    }, [currentBranch, branches.length, handleBranchChange]);

    const contextValue = useMemo(
        () => ({
            branches,
            currentBranch,
            goToNext,
            goToPrevious,
            setBranches,
            totalBranches: branches.length,
        }),
        [branches, currentBranch, goToNext, goToPrevious],
    );

    return (
        <MessageBranchContext.Provider value={contextValue}>
            <div className={cn('ai-message-branch', className)} {...props} />
        </MessageBranchContext.Provider>
    );
};

export const MessageBranchContent = ({ children, ...props }) => {
    const { currentBranch, setBranches, branches } = useMessageBranch();
    const childrenArray = useMemo(
        () => (Array.isArray(children) ? children : [children]),
        [children],
    );

    // Use useEffect to update branches when they change
    useEffect(() => {
        if (branches.length !== childrenArray.length) {
            setBranches(childrenArray);
        }
    }, [childrenArray, branches, setBranches]);

    return childrenArray.map((branch, index) => (
        <div
            className={cn(
                'ai-message-branch-content-wrapper',
                index === currentBranch ? 'block' : 'hidden',
            )}
            key={branch.key}
            {...props}
        >
            {branch}
        </div>
    ));
};

export const MessageBranchSelector = ({ className, ...props }) => {
    const { totalBranches } = useMessageBranch();

    // Don't render if there's only one branch
    if (totalBranches <= 1) {
        return null;
    }

    return <div className={cn('ai-message-branch-selector', className)} {...props} />;
};

export const MessageBranchPrevious = ({ children, ...props }) => {
    const { goToPrevious, totalBranches } = useMessageBranch();

    return (
        <Button
            aria-label="Previous branch"
            disabled={totalBranches <= 1}
            onClick={goToPrevious}
            size="icon-sm"
            type="button"
            variant="ghost"
            {...props}
        >
            {children ?? <ChevronLeftIcon size={14} />}
        </Button>
    );
};

export const MessageBranchNext = ({ children, ...props }) => {
    const { goToNext, totalBranches } = useMessageBranch();

    return (
        <Button
            aria-label="Next branch"
            disabled={totalBranches <= 1}
            onClick={goToNext}
            size="icon-sm"
            type="button"
            variant="ghost"
            {...props}
        >
            {children ?? <ChevronRightIcon size={14} />}
        </Button>
    );
};

export const MessageBranchPage = ({ className, ...props }) => {
    const { currentBranch, totalBranches } = useMessageBranch();

    return (
        <span className={cn('ai-message-branch-page', className)} {...props}>
            {currentBranch + 1} of {totalBranches}
        </span>
    );
};

const renderSimpleMarkdown = (text) => {
    if (typeof text !== 'string') return text;

    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Inline code
    html = html.replace(
        /`([^`]+)`/g,
        '<code style="background-color: var(--color-gray-100, #f3f4f6); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.875rem;">$1</code>',
    );

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Bullet points
    html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');

    // Wrap lists
    html = html.replace(
        /(<li>.*?<\/li>)/gs,
        '<ul style="list-style-type: disc; padding-left: 20px; margin: 8px 0;">$1</ul>',
    );
    html = html.replace(/<\/ul>\s*<ul[^>]*>/g, '');

    // Line breaks
    const parts = html.split(/(<pre[\s\S]*?<\/pre>)/);
    const formattedParts = parts.map((part) => {
        if (part.startsWith('<pre')) return part;
        return part.replace(/\n/g, '<br />');
    });

    return formattedParts.join('');
};

export const MessageResponse = memo(
    ({ className, children, ...props }) => {
        if (typeof children !== 'string') {
            return (
                <div className={cn('ai-message-response', className)} {...props}>
                    {children}
                </div>
            );
        }
        return (
            <div
                className={cn('ai-message-response', className)}
                dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(children) }}
                {...props}
            />
        );
    },
    (prevProps, nextProps) => prevProps.children === nextProps.children,
);

MessageResponse.displayName = 'MessageResponse';

export const MessageToolbar = ({ className, children, ...props }) => (
    <div className={cn('ai-message-toolbar', className)} {...props}>
        {children}
    </div>
);
