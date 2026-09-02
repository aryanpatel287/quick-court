import CircularAvatar from '@/components/Shared/DataDisplay/CircularAvatar/CircularAvatar';
import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutlined';
import Group from '@mui/icons-material/Group';

const DEFAULT_AVATARS = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
];

function KanbanCardFooter({ commentsCount = 0, subtasksCount = 0, assignees = [] }) {
    if (commentsCount <= 0 && subtasksCount <= 0 && (!assignees || assignees.length === 0)) {
        return null;
    }

    return (
        <div className="kanban-card-footer">
            <div className="kanban-card-metrics">
                {commentsCount > 0 && (
                    <span className="kanban-card-metric-item" title={`${commentsCount} comments`}>
                        <ChatBubbleOutline style={{ fontSize: 14 }} />
                        <span>{commentsCount}</span>
                    </span>
                )}
                {subtasksCount > 0 && (
                    <span className="kanban-card-metric-item" title={`${subtasksCount} subtasks`}>
                        <Group style={{ fontSize: 14 }} />
                        <span>{subtasksCount}</span>
                    </span>
                )}
            </div>

            {assignees && assignees.length > 0 && (
                <div className="kanban-card-avatar-stack">
                    {assignees.slice(0, 3).map((assignee, idx) => {
                        const src =
                            typeof assignee === 'string'
                                ? assignee
                                : assignee.avatar || DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length];
                        const name =
                            typeof assignee === 'string'
                                ? `User ${idx + 1}`
                                : assignee.name || 'Team member';
                        return (
                            <div
                                key={idx}
                                className="kanban-avatar-wrapper"
                                style={{ zIndex: assignees.length - idx }}
                                title={name}
                            >
                                <CircularAvatar src={src} size={24} name={name} />
                            </div>
                        );
                    })}
                    {assignees.length > 3 && (
                        <div className="kanban-avatar-more" style={{ zIndex: 0 }}>
                            +{assignees.length - 3}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default KanbanCardFooter;
