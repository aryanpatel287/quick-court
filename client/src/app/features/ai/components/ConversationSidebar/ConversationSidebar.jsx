import { useState, useRef, useEffect } from 'react';
import { Trash2, Edit2, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Dialog from '@/components/Shared/Feedback/Dialog/Dialog';
import './ConversationSidebar.scss';

/**
 * ConversationSidebar
 *
 * Props:
 *  - conversations  { id, title }[]
 *  - activeConvId   string
 *  - onSelect       (id: string) => void
 *  - onNew          () => void
 *  - onDelete       (e: MouseEvent, id: string) => void
 *  - onRename       (id: string, title: string) => void
 */
export default function ConversationSidebar({
    conversations,
    activeConvId,
    onSelect,
    onNew,
    onDelete,
    onRename,
}) {
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [chatIdToDelete, setChatIdToDelete] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    const handleStartRename = (e, c) => {
        e.stopPropagation();
        setEditingId(c.id);
        setEditTitle(c.title);
    };

    const handleSaveRename = (id) => {
        if (
            editTitle.trim() &&
            editTitle.trim() !== conversations.find((c) => c.id === id)?.title
        ) {
            onRename(id, editTitle.trim());
        }
        setEditingId(null);
    };

    const handleKeyDown = (e, id) => {
        if (e.key === 'Enter') {
            handleSaveRename(id);
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        setChatIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = (e) => {
        if (chatIdToDelete) {
            onDelete(e, chatIdToDelete);
        }
        setIsDeleteDialogOpen(false);
        setChatIdToDelete(null);
    };

    const handleCloseDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setChatIdToDelete(null);
    };

    return (
        <aside className="conv-sidebar">
            <div className="conv-sidebar__section">
                {/* New Chat Button */}
                <button type="button" className="conv-sidebar__new-chat-btn" onClick={onNew}>
                    <MessageSquarePlus size={16} />
                    <span>New Chat</span>
                </button>

                {/* Header */}
                <div className="conv-sidebar__header">
                    <h3 className="conv-sidebar__title">Recent Conversations</h3>
                </div>

                {/* List */}
                <div className="conv-sidebar__list">
                    {conversations.map((c) => (
                        <div
                            key={c.id}
                            role="button"
                            tabIndex={0}
                            className={cn(
                                'conv-sidebar__item',
                                c.id === activeConvId && 'is-active',
                            )}
                            onClick={() => onSelect(c.id)}
                            onKeyDown={(e) => e.key === 'Enter' && onSelect(c.id)}
                        >
                            {editingId === c.id ? (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="conv-sidebar__item-input"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onBlur={() => handleSaveRename(c.id)}
                                    onKeyDown={(e) => handleKeyDown(e, c.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span
                                    className="conv-sidebar__item-name"
                                    onDoubleClick={(e) => handleStartRename(e, c)}
                                    title="Double click to rename"
                                >
                                    {c.title}
                                </span>
                            )}

                            <div className="conv-sidebar__item-actions">
                                <button
                                    type="button"
                                    className="conv-sidebar__action-btn conv-sidebar__rename-btn"
                                    title="Rename conversation"
                                    onClick={(e) => handleStartRename(e, c)}
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button
                                    type="button"
                                    className="conv-sidebar__action-btn conv-sidebar__delete-btn"
                                    title="Delete conversation"
                                    onClick={(e) => handleDeleteClick(e, c.id)}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog
                isOpen={isDeleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleConfirmDelete}
                title="Delete Conversation"
                variant="danger"
                confirmText="Delete"
                cancelText="Cancel"
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-gray-600)',
                    }}
                >
                    Are you sure you want to delete this conversation? This action cannot be undone.
                </p>
            </Dialog>
        </aside>
    );
}
