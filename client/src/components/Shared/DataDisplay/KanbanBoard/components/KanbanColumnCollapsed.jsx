function KanbanColumnCollapsed({ title, color = '#94a3b8', countBadgeText, onExpand }) {
    return (
        <div
            className="kanban-column is-collapsed"
            onClick={onExpand}
            title="Click to expand column"
        >
            <div className="kanban-column-collapsed-inner">
                <span className="kanban-column-dot" style={{ backgroundColor: color }} />
                <span className="kanban-column-count">{countBadgeText}</span>
                <span className="kanban-column-collapsed-title">{title}</span>
            </div>
        </div>
    );
}

export default KanbanColumnCollapsed;
