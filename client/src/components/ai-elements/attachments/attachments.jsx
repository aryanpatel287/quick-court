'use client';

import Button from '@/components/Shared/Buttons/Button/Button';
import { cn } from '@/lib/utils';
import './attachments.scss';
import {
    FileTextIcon,
    GlobeIcon,
    ImageIcon,
    Music2Icon,
    PaperclipIcon,
    VideoIcon,
    XIcon,
} from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const mediaCategoryIcons = {
    audio: Music2Icon,
    document: FileTextIcon,
    image: ImageIcon,
    source: GlobeIcon,
    unknown: PaperclipIcon,
    video: VideoIcon,
};

// ============================================================================
// Utility Functions
// ============================================================================

const getMediaCategory = (data) => {
    if (data.type === 'source-document') {
        return 'source';
    }

    const mediaType = data.mediaType ?? '';

    if (mediaType.startsWith('image/')) {
        return 'image';
    }
    if (mediaType.startsWith('video/')) {
        return 'video';
    }
    if (mediaType.startsWith('audio/')) {
        return 'audio';
    }
    if (mediaType.startsWith('application/') || mediaType.startsWith('text/')) {
        return 'document';
    }

    return 'unknown';
};

const getAttachmentLabel = (data) => {
    if (data.type === 'source-document') {
        return data.title || data.filename || 'Source';
    }

    const category = getMediaCategory(data);
    return data.filename || (category === 'image' ? 'Image' : 'Attachment');
};

const renderAttachmentImage = (url, filename, isGrid) =>
    isGrid ? (
        <img alt={filename || 'Image'} className="" height={96} src={url} width={96} />
    ) : (
        <img alt={filename || 'Image'} className="rounded" height={20} src={url} width={20} />
    );

// ============================================================================
// Contexts
// ============================================================================

const AttachmentsContext = createContext(null);
const AttachmentContext = createContext(null);

// ============================================================================
// Hooks
// ============================================================================

const useAttachmentsContext = () => useContext(AttachmentsContext) ?? { variant: 'grid' };

const useAttachmentContext = () => {
    const ctx = useContext(AttachmentContext);
    if (!ctx) {
        throw new Error('Attachment components must be used within <Attachment>');
    }
    return ctx;
};

// ============================================================================
// Attachments - Container
// ============================================================================

export const Attachments = ({ variant = 'grid', className, children, ...props }) => {
    const contextValue = useMemo(() => ({ variant }), [variant]);

    return (
        <AttachmentsContext.Provider value={contextValue}>
            <div className={cn('ai-attachments', `variant-${variant}`, className)} {...props}>
                {children}
            </div>
        </AttachmentsContext.Provider>
    );
};

// ============================================================================
// Attachment - Item
// ============================================================================

export const Attachment = ({ data, onRemove, className, children, ...props }) => {
    const { variant } = useAttachmentsContext();
    const mediaCategory = getMediaCategory(data);

    const contextValue = useMemo(
        () => ({ data, mediaCategory, onRemove, variant }),
        [data, mediaCategory, onRemove, variant],
    );

    return (
        <AttachmentContext.Provider value={contextValue}>
            <div className={cn('ai-attachment', `variant-${variant}`, className)} {...props}>
                {children}
            </div>
        </AttachmentContext.Provider>
    );
};

// ============================================================================
// AttachmentPreview - Media preview
// ============================================================================

export const AttachmentPreview = ({ fallbackIcon, className, ...props }) => {
    const { data, mediaCategory, variant } = useAttachmentContext();

    const iconSize = 'ai-attachment-preview-icon';

    const renderIcon = (Icon) => <Icon className={cn(iconSize)} />;

    const renderContent = () => {
        if (mediaCategory === 'image' && data.type === 'file' && data.url) {
            return renderAttachmentImage(data.url, data.filename, variant === 'grid');
        }

        if (mediaCategory === 'video' && data.type === 'file' && data.url) {
            return <video className="ai-attachment-video" muted src={data.url} />;
        }

        const Icon = mediaCategoryIcons[mediaCategory];
        return fallbackIcon ?? renderIcon(Icon);
    };

    return (
        <div className={cn('ai-attachment-preview', `variant-${variant}`, className)} {...props}>
            {renderContent()}
        </div>
    );
};

// ============================================================================
// AttachmentInfo - Name and type display
// ============================================================================

export const AttachmentInfo = ({ showMediaType = false, className, ...props }) => {
    const { data, variant } = useAttachmentContext();
    const label = getAttachmentLabel(data);

    if (variant === 'grid') {
        return null;
    }

    return (
        <div className={cn('ai-attachment-info', className)} {...props}>
            <span className="ai-attachment-label">{label}</span>
            {showMediaType && data.mediaType && (
                <span className="ai-attachment-type">{data.mediaType}</span>
            )}
        </div>
    );
};

// ============================================================================
// AttachmentRemove - Remove button
// ============================================================================

export const AttachmentRemove = ({ label = 'Remove', className, children, ...props }) => {
    const { onRemove, variant } = useAttachmentContext();

    const handleClick = useCallback(
        (e) => {
            e.stopPropagation();
            onRemove?.();
        },
        [onRemove],
    );

    if (!onRemove) {
        return null;
    }

    return (
        <Button
            aria-label={label}
            className={cn('ai-attachment-remove', `variant-${variant}`, className)}
            onClick={handleClick}
            type="button"
            variant="ghost"
            {...props}
        >
            {children ?? <XIcon />}
            <span className="sr-only">{label}</span>
        </Button>
    );
};

// ============================================================================
// AttachmentHoverCard - Hover preview
// ============================================================================

const HoverCardContext = createContext(null);

export const AttachmentHoverCard = ({ children, ...props }) => {
    const [isOpen, setIsOpen] = useState(false);
    const contextValue = useMemo(() => ({ isOpen, setIsOpen }), [isOpen]);

    return (
        <HoverCardContext.Provider value={contextValue}>
            <div
                className="ai-attachment-hover-card"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                {...props}
            >
                {children}
            </div>
        </HoverCardContext.Provider>
    );
};

export const AttachmentHoverCardTrigger = ({ children, ...props }) => (
    <div {...props}>{children}</div>
);

export const AttachmentHoverCardContent = ({ className, ...props }) => {
    const { isOpen } = useContext(HoverCardContext);
    if (!isOpen) return null;
    return <div className={cn('ai-attachment-hover-card-content', className)} {...props} />;
};

// ============================================================================
// AttachmentEmpty - Empty state
// ============================================================================

export const AttachmentEmpty = ({ className, children, ...props }) => (
    <div className={cn('ai-attachment-empty', className)} {...props}>
        {children ?? 'No attachments'}
    </div>
);
