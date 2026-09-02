function KanbanQuickAddForm({
    quickInputRef,
    columnTitle,
    quickTitle,
    setQuickTitle,
    onSubmit,
    onCancel,
}) {
    return (
        <form className="kanban-column-quick-add-form" onSubmit={onSubmit}>
            <input
                ref={quickInputRef}
                type="text"
                className="kanban-quick-add-input"
                placeholder={`Add card to ${columnTitle}...`}
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') onCancel();
                }}
            />
            <div className="kanban-quick-add-actions">
                <button type="submit" className="quick-add-save-btn" disabled={!quickTitle.trim()}>
                    Add Card
                </button>
                <button type="button" className="quick-add-cancel-btn" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default KanbanQuickAddForm;
