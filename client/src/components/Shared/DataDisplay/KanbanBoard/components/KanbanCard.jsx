function KanbanCard({ item, onCardClick, onDragStart, onDragEnd }) {
    return (
        <div
            className="kanban-card"
            draggable
            onDragStart={(e) => onDragStart && onDragStart(e, item)}
            onDragEnd={(e) => onDragEnd && onDragEnd(e, item)}
            onClick={() => onCardClick && onCardClick(item)}
        >
            Card
        </div>
    );
}

export default KanbanCard;
