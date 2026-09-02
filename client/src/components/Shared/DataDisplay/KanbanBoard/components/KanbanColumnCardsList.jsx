import KanbanCard from './KanbanCard';
import KanbanQuickAddForm from './KanbanQuickAddForm';
import EmptyState from '@/components/Shared/DataDisplay/EmptyState/EmptyState';

function KanbanColumnCardsList({
    cardsListRef,
    onScroll,
    isQuickAdding,
    quickInputRef,
    columnTitle,
    quickTitle,
    setQuickTitle,
    onSubmitQuickAdd,
    onCancelQuickAdd,
    items,
    visibleItems,
    renderLimit,
    showSkeleton,
    onCardClick,
    onCardAction,
    onDragStart,
    onCardDragEnd,
}) {
    return (
        <div className="kanban-column-cards-list" ref={cardsListRef} onScroll={onScroll}>
            {isQuickAdding && (
                <KanbanQuickAddForm
                    quickInputRef={quickInputRef}
                    columnTitle={columnTitle}
                    quickTitle={quickTitle}
                    setQuickTitle={setQuickTitle}
                    onSubmit={onSubmitQuickAdd}
                    onCancel={onCancelQuickAdd}
                />
            )}

            {items.length === 0 && !showSkeleton && !isQuickAdding ? (
                <EmptyState variant="minimal" title="No tasks in this stage" size="sm" />
            ) : (
                <>
                    {visibleItems.map((item) => (
                        <KanbanCard
                            key={item.id}
                            item={item}
                            onCardClick={onCardClick}
                            onActionClick={onCardAction}
                            onDragStart={onDragStart}
                            onDragEnd={onCardDragEnd}
                        />
                    ))}
                    {showSkeleton && (
                        <div className="kanban-card-skeleton-placeholder">
                            <div className="skeleton-line skeleton-title" />
                            <div className="skeleton-line skeleton-subtitle" />
                        </div>
                    )}
                    {renderLimit < items.length && !showSkeleton && (
                        <div className="kanban-column-loading-more">
                            <span>Loading more ({items.length - renderLimit} remaining)...</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default KanbanColumnCardsList;
