function KanbanCardFields({ fields = [] }) {
    if (!fields || fields.length === 0) return null;

    return (
        <div className="kanban-card-fields-list">
            {fields.map((f, idx) => (
                <div key={idx} className="kanban-card-field-row">
                    <span className="field-label">{f.label}</span>
                    <span className="field-value">{f.value}</span>
                </div>
            ))}
        </div>
    );
}

export default KanbanCardFields;
