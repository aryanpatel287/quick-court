import { Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import Badge from '@/components/Shared/DataDisplay/Badge/Badge';
import Button from '@/components/Shared/Buttons/Button/Button';
import EmptyState from '@/components/Shared/DataDisplay/EmptyState/EmptyState';
import './EmptyStateCard.scss';

function EmptyStateCard({
    title = null,
    subtitle = null,
    emptyTitle = 'No records found',
    emptyDescription = 'There are no items to display',
    icon: IconComponent = null,
    items = [],
    sessions = [],
    actionLabel,
    onActionClick,
    headerAction,
    className = '',
}) {
    const displayItems = sessions.length > 0 ? sessions : items;
    const isEmpty = !displayItems || displayItems.length === 0;

    return (
        <div className={`empty-state-card-container ${className}`}>
            {/* Card Header */}
            {(title || subtitle || headerAction) && (
                <div className="card-header">
                    <div className="header-title-group">
                        {title && <h3 className="header-title">{title}</h3>}
                        {subtitle && <p className="header-subtitle">{subtitle}</p>}
                    </div>
                    {headerAction && <div className="header-action-slot">{headerAction}</div>}
                </div>
            )}

            {/* Card Body */}
            <div className="card-body">
                {isEmpty ? (
                    <EmptyState
                        title={emptyTitle}
                        description={emptyDescription}
                        icon={IconComponent}
                        actionLabel={actionLabel}
                        onActionClick={onActionClick}
                        variant="inline"
                    />
                ) : (
                    <div className="items-list-wrapper">
                        {displayItems.map((item, index) => (
                            <div className="item-row-card" key={item.id || index}>
                                <div className="item-left-info">
                                    <div className="date-badge">
                                        <span className="date-day">{item.day || '24'}</span>
                                        <span className="date-month">{item.month || 'JUL'}</span>
                                    </div>
                                    <div className="item-details">
                                        <h5 className="item-title">{item.title || item.name}</h5>
                                        <div className="item-meta">
                                            <span className="meta-time">
                                                <Clock size={12} />
                                                {item.time || '10:00 AM - 11:00 AM'}
                                            </span>
                                            {item.host && (
                                                <span className="meta-host">• {item.host}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="item-right-actions">
                                    {item.status && (
                                        <Badge
                                            variant={
                                                item.status === 'Confirmed'
                                                    ? 'success'
                                                    : item.status === 'Pending'
                                                      ? 'warning'
                                                      : 'info'
                                            }
                                            type="light"
                                            showDot={true}
                                        >
                                            {item.status}
                                        </Badge>
                                    )}
                                    {item.onJoinClick && (
                                        <Button
                                            variant="primary"
                                            onClick={() => item.onJoinClick(item)}
                                            className="item-join-btn"
                                        >
                                            <span>Join</span>
                                            <ArrowRight size={14} style={{ marginLeft: '6px' }} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Named alias for convenience
export function UpcomingSessionsCard(props) {
    return (
        <EmptyStateCard
            title="Upcoming Sessions"
            subtitle="Your next confirmed bookings"
            emptyTitle="No upcoming sessions"
            emptyDescription="Your upcoming sessions will appear here"
            icon={CalendarIcon}
            {...props}
        />
    );
}

export default EmptyStateCard;
