import { useState, useEffect, useRef, useMemo } from 'react';
import KanbanColumnHeader from './KanbanColumnHeader';
import KanbanColumnCollapsed from './KanbanColumnCollapsed';
import KanbanColumnCardsList from './KanbanColumnCardsList';
import { useColumnDrag } from './useColumnDrag';

function KanbanColumn({
    column,
    items = [],
    onCardClick,
    onCardAction,
    onAddItem,
    onDropCard,
    draggedItem,
    onCardDragStart,
    onCardDragEnd,
    batchSize = 25,
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isQuickAdding, setIsQuickAdding] = useState(false);
    const [quickTitle, setQuickTitle] = useState('');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const cardsListRef = useRef(null);
    const quickInputRef = useRef(null);
    const [renderLimit, setRenderLimit] = useState(batchSize);

    const {
        isDragOver,
        handleDragEnter,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleDragStart,
    } = useColumnDrag({ columnId: column.id, onDropCard, onCardDragStart });

    const isFromDifferentColumn = draggedItem && draggedItem.columnId !== column.id;
    const showSkeleton = isDragOver && isFromDifferentColumn;

    useEffect(() => setRenderLimit(batchSize), [items.length, batchSize]);

    useEffect(() => {
        if (isQuickAdding && quickInputRef.current) quickInputRef.current.focus();
    }, [isQuickAdding]);

    const handleColumnScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        setShowScrollTop(scrollTop > 100);
        if (scrollTop + clientHeight >= scrollHeight - 200 && renderLimit < items.length) {
            setRenderLimit((prev) => Math.min(prev + batchSize, items.length));
        }
    };

    const scrollToTop = () => cardsListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    const handleSubmitQuickAdd = (e) => {
        e.preventDefault();
        if (!quickTitle.trim()) return;
        if (onAddItem) onAddItem(column.id, quickTitle.trim());
        setQuickTitle('');
        setIsQuickAdding(false);
    };

    const visibleItems = useMemo(() => items.slice(0, renderLimit), [items, renderLimit]);

    const countBadgeText = useMemo(() => {
        const total = column.count !== undefined ? column.count : items.length;
        if (total >= 10000) return `${(total / 1000).toFixed(0)}k+`;
        if (total >= 1000) return total.toLocaleString();
        return total;
    }, [column.count, items.length]);

    if (isCollapsed) {
        return (
            <KanbanColumnCollapsed
                title={column.title}
                color={column.color}
                countBadgeText={countBadgeText}
                onExpand={() => setIsCollapsed(false)}
            />
        );
    }

    return (
        <div
            className={`kanban-column ${isDragOver ? 'is-drag-over' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <KanbanColumnHeader
                columnTitle={column.title}
                columnColor={column.color}
                countBadgeText={countBadgeText}
                showScrollTop={showScrollTop}
                scrollToTop={scrollToTop}
                isQuickAdding={isQuickAdding}
                setIsQuickAdding={setIsQuickAdding}
                onCollapse={() => setIsCollapsed(true)}
            />

            <KanbanColumnCardsList
                cardsListRef={cardsListRef}
                onScroll={handleColumnScroll}
                isQuickAdding={isQuickAdding}
                quickInputRef={quickInputRef}
                columnTitle={column.title}
                quickTitle={quickTitle}
                setQuickTitle={setQuickTitle}
                onSubmitQuickAdd={handleSubmitQuickAdd}
                onCancelQuickAdd={() => setIsQuickAdding(false)}
                items={items}
                visibleItems={visibleItems}
                renderLimit={renderLimit}
                showSkeleton={showSkeleton}
                onCardClick={onCardClick}
                onCardAction={onCardAction}
                onDragStart={handleDragStart}
                onCardDragEnd={onCardDragEnd}
            />
        </div>
    );
}

export default KanbanColumn;
