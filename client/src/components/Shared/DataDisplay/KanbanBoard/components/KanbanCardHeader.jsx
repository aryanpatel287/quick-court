import Refresh from '@mui/icons-material/Refresh';
import MoreHoriz from '@mui/icons-material/MoreHoriz';

function KanbanCardHeader({ updatedText, showActions, item, onActionClick }) {
    if (!updatedText) return null;

    return (
        <div className="kanban-card-header">
            <span className="kanban-card-updated">{updatedText}</span>
            {showActions && (
                <div className="kanban-card-actions">
                    <button
                        type="button"
                        className="kanban-card-action-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onActionClick) onActionClick('refresh', item);
                        }}
                        title="Refresh item"
                    >
                        <Refresh style={{ fontSize: 13 }} />
                    </button>
                    <button
                        type="button"
                        className="kanban-card-action-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onActionClick) onActionClick('more', item);
                        }}
                        title="More options"
                    >
                        <MoreHoriz style={{ fontSize: 14 }} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default KanbanCardHeader;
