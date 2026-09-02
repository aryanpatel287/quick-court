import SearchBar from '@/components/Shared/Form/SearchBar/SearchBar';
import Add from '@mui/icons-material/Add';

function KanbanBoardHeader({
    headerTitle = '',
    headerSubtitle = '',
    searchable = true,
    searchQuery = '',
    onSearchChange,
    searchPlaceholder = 'Search tasks...',
    headerActions = null,
    onAddColumn,
}) {
    if (!headerTitle && !searchable && !headerActions && !onAddColumn) {
        return null;
    }

    return (
        <div className="kanban-board-header">
            <div className="kanban-board-header-left">
                {headerTitle && (
                    <div className="kanban-board-title-group">
                        <h2 className="kanban-board-title">{headerTitle}</h2>
                        {headerSubtitle && (
                            <p className="kanban-board-subtitle">{headerSubtitle}</p>
                        )}
                    </div>
                )}
                {searchable && (
                    <div className="kanban-board-search">
                        <SearchBar
                            value={searchQuery}
                            onChange={onSearchChange}
                            placeholder={searchPlaceholder}
                        />
                    </div>
                )}
            </div>

            <div className="kanban-board-header-right">
                {headerActions}
                {onAddColumn && (
                    <button
                        type="button"
                        className="kanban-board-add-col-btn"
                        onClick={onAddColumn}
                    >
                        <Add style={{ fontSize: 16 }} />
                        <span>Add Column</span>
                    </button>
                )}
            </div>
        </div>
    );
}

export default KanbanBoardHeader;
