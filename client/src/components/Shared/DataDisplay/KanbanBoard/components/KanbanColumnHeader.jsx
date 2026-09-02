import Tooltip from '@/components/Shared/DataDisplay/Tooltip/Tooltip';
import Add from '@mui/icons-material/Add';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import UnfoldLess from '@mui/icons-material/UnfoldLess';

function KanbanColumnHeader({
    columnTitle,
    columnColor = '#94a3b8',
    countBadgeText,
    showScrollTop,
    scrollToTop,
    isQuickAdding,
    setIsQuickAdding,
    onCollapse,
}) {
    return (
        <div className="kanban-column-header">
            <div className="kanban-column-title-group">
                <span className="kanban-column-dot" style={{ backgroundColor: columnColor }} />
                <h3 className="kanban-column-title">{columnTitle}</h3>
                <span className="kanban-column-count">{countBadgeText}</span>
            </div>

            <div className="kanban-column-header-actions">
                {showScrollTop && (
                    <Tooltip content="Scroll to top" position="bottom">
                        <button
                            type="button"
                            className="kanban-column-scroll-top-btn"
                            onClick={scrollToTop}
                            aria-label="Scroll column to top"
                        >
                            <KeyboardArrowUp style={{ fontSize: 14 }} />
                        </button>
                    </Tooltip>
                )}

                <Tooltip
                    content={isQuickAdding ? 'Close quick add' : 'Add item to stage'}
                    position="bottom"
                >
                    <button
                        type="button"
                        className="kanban-column-add-btn"
                        onClick={() => setIsQuickAdding(!isQuickAdding)}
                    >
                        <Add style={{ fontSize: 16 }} />
                    </button>
                </Tooltip>

                <Tooltip content="Collapse column" position="bottom">
                    <button
                        type="button"
                        className="kanban-column-collapse-btn"
                        onClick={onCollapse}
                    >
                        <UnfoldLess style={{ fontSize: 14 }} />
                    </button>
                </Tooltip>
            </div>
        </div>
    );
}

export default KanbanColumnHeader;
