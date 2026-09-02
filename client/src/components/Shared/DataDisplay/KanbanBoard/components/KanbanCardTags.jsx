function KanbanCardTags({ tags = [] }) {
    if (!tags || tags.length === 0) return null;

    return (
        <div className="kanban-card-tags">
            {tags.map((tag, idx) => (
                <span
                    key={idx}
                    className="kanban-card-tag"
                    style={{
                        backgroundColor: typeof tag === 'object' ? tag.bg || '#f1f5f9' : '#f1f5f9',
                        color: typeof tag === 'object' ? tag.color || '#475569' : '#475569',
                    }}
                >
                    {typeof tag === 'object' ? tag.label : tag}
                </span>
            ))}
        </div>
    );
}

export default KanbanCardTags;
