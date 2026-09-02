function KanbanCardProgress({ progress, progressVariant }) {
    if (typeof progress !== 'number') return null;

    const getColor = (val) => {
        if (progressVariant)
            return progressVariant === 'success'
                ? '#10b981'
                : progressVariant === 'warning'
                  ? '#f59e0b'
                  : '#6366f1';
        if (val >= 80) return '#10b981';
        if (val >= 35) return '#f59e0b';
        return '#6366f1';
    };

    return (
        <div className="kanban-card-progress-container">
            <div className="kanban-card-progress-header">
                <span className="progress-label">PROGRESS</span>
                <span className="progress-value">{progress}%</span>
            </div>
            <div className="kanban-card-progress-bar-wrapper">
                <div
                    style={{
                        background: '#e2e8f0',
                        borderRadius: '4px',
                        height: '5px',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: `${Math.min(Math.max(progress, 0), 100)}%`,
                            height: '100%',
                            background: getColor(progress),
                            borderRadius: '4px',
                            transition: 'width 0.3s ease',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default KanbanCardProgress;
