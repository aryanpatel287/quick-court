import { Check, Clock, Info, XCircle, CircleDot, Calendar } from 'lucide-react';
import Badge from '@/components/Shared/DataDisplay/Badge/Badge';
import EmptyState from '@/components/Shared/DataDisplay/EmptyState/EmptyState';
import './Timeline.scss';

/**
 * Helper to get default icon by variant if no custom icon is provided.
 */
function getDefaultVariantIcon(variant, active) {
    switch (variant) {
        case 'success':
            return <Check size={12} strokeWidth={2.8} />;
        case 'warning':
            return <Clock size={12} strokeWidth={2.5} />;
        case 'danger':
            return <XCircle size={12} strokeWidth={2.5} />;
        case 'info':
            return <Info size={12} strokeWidth={2.5} />;
        case 'primary':
            return active ? (
                <CircleDot size={12} strokeWidth={2.8} />
            ) : (
                <Check size={12} strokeWidth={2.8} />
            );
        default:
            return null;
    }
}

function Timeline({
    items = [],
    align = 'left', // 'left' | 'right' | 'alternate'
    mode = 'vertical', // 'vertical' | 'horizontal'
    compact = false,
    onItemClick = null,
    className = '',
}) {
    if (!items || items.length === 0) {
        return (
            <div className={`shared-timeline-container empty ${className}`}>
                <EmptyState
                    variant="compact"
                    icon={Calendar}
                    title="No timeline items to display"
                />
            </div>
        );
    }

    return (
        <div
            className={`shared-timeline-container mode-${mode} align-${align} ${compact ? 'is-compact' : ''} ${className}`}
        >
            <div className="timeline-list">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const isAlternateRight = align === 'alternate' && index % 2 !== 0;
                    const variant = item.variant || 'primary';
                    const isActive = Boolean(item.active);

                    const itemIcon = item.icon || getDefaultVariantIcon(variant, isActive);

                    return (
                        <div
                            key={item.id || index}
                            className={`timeline-item ${variant} ${isActive ? 'is-active' : ''} ${isAlternateRight ? 'is-alternate-right' : ''} ${item.disabled ? 'is-disabled' : ''}`}
                            onClick={(e) => {
                                if (item.disabled) return;
                                if (onItemClick) onItemClick(item, index, e);
                            }}
                        >
                            {/* Connector Line */}
                            {!isLast && <div className="timeline-line" />}

                            {/* Dot / Node Icon Wrapper */}
                            <div className="timeline-dot-wrapper">
                                <span className="timeline-dot">{itemIcon}</span>
                            </div>

                            {/* Content Box */}
                            <div className="timeline-content">
                                {/* Header (Title + Timestamp + Badge) */}
                                <div className="timeline-header">
                                    <div className="timeline-title-row">
                                        {item.title && (
                                            <h4 className="timeline-title">{item.title}</h4>
                                        )}
                                        {item.badge && (
                                            <Badge
                                                variant={item.badgeVariant || 'neutral'}
                                                type="light"
                                            >
                                                {item.badge}
                                            </Badge>
                                        )}
                                    </div>

                                    {item.time && (
                                        <span className="timeline-time">
                                            <Calendar size={12} className="time-icon" />
                                            {item.time}
                                        </span>
                                    )}
                                </div>

                                {/* Subtitle */}
                                {item.subtitle && (
                                    <p className="timeline-subtitle">{item.subtitle}</p>
                                )}

                                {/* Main Body Description */}
                                {item.description && (
                                    <div className="timeline-description">
                                        {typeof item.description === 'string' ? (
                                            <p>{item.description}</p>
                                        ) : (
                                            item.description
                                        )}
                                    </div>
                                )}

                                {/* Custom Content JSX */}
                                {item.children && (
                                    <div className="timeline-custom-children">{item.children}</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Timeline;
