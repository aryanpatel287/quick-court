import CircularAvatar from '@/components/Shared/DataDisplay/CircularAvatar/CircularAvatar';

function KanbanCardTitleRow({ title, subtitle, badge, avatar }) {
    const badgeObj =
        typeof badge === 'string' ? { label: badge, bg: '#ecfdf5', color: '#059669' } : badge;

    return (
        <div className="kanban-card-top-group">
            <div className="kanban-card-title-block">
                <h4 className="kanban-card-title">{title}</h4>
                {subtitle && <p className="kanban-card-subtitle">{subtitle}</p>}
                {badgeObj && (
                    <span
                        className="kanban-card-pill-badge"
                        style={{
                            backgroundColor: badgeObj.bg || '#ecfdf5',
                            color: badgeObj.color || '#059669',
                        }}
                    >
                        {badgeObj.label}
                    </span>
                )}
            </div>

            {avatar && (
                <div className="kanban-card-avatar-top">
                    <CircularAvatar
                        src={typeof avatar === 'string' ? avatar : avatar.src}
                        size={36}
                        name={title}
                    />
                </div>
            )}
        </div>
    );
}

export default KanbanCardTitleRow;
