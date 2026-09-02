import React from 'react';
import './MetricCard.scss';

function MetricCard({
    label = '',
    title = '', // Alias for label
    value = '',
    icon: IconComponent = null,
    iconColor = '',
    variant = 'default',
    trend = '',
    subValue = '', // Alias for trend
    showTrend = true,
    showSubValue = true, // Alias for showTrend
    trendType = null, // 'positive' | 'negative' | 'neutral'
    isPositive = null, // boolean override for positive trend direction
    onClick = null,
    className = '',
}) {
    const isClickable = typeof onClick === 'function';

    const displayLabel = label || title;
    const displayTrend = trend || subValue;
    const shouldShowTrend = showTrend && showSubValue;

    // Detect trend direction/type
    let resolvedTrendType = 'neutral';
    if (trendType) {
        resolvedTrendType = trendType;
    } else if (isPositive !== null && isPositive !== undefined) {
        resolvedTrendType = isPositive ? 'positive' : 'negative';
    } else if (typeof displayTrend === 'string') {
        const trimmed = displayTrend.trim();
        if (
            trimmed.startsWith('+') ||
            trimmed.includes('↑') ||
            trimmed.toLowerCase().includes('up')
        ) {
            resolvedTrendType = 'positive';
        } else if (
            trimmed.startsWith('-') ||
            trimmed.includes('↓') ||
            trimmed.toLowerCase().includes('down')
        ) {
            resolvedTrendType = 'negative';
        }
    }

    return (
        <div
            className={`shared-metric-card variant-${variant} ${isClickable ? 'is-clickable' : ''} ${className}`}
            onClick={isClickable ? onClick : undefined}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
        >
            <div className="metric-card-top">
                <span className="metric-card-label">{displayLabel}</span>
                {IconComponent && (
                    <div
                        className="metric-card-icon"
                        style={iconColor ? { color: iconColor } : undefined}
                    >
                        {React.isValidElement(IconComponent) ? (
                            IconComponent
                        ) : (
                            <IconComponent size={20} />
                        )}
                    </div>
                )}
            </div>

            <div className="metric-card-bottom">
                <div className="metric-card-value">{value}</div>
                {shouldShowTrend && displayTrend && (
                    <div className={`metric-card-trend ${resolvedTrendType}`}>
                        {resolvedTrendType === 'positive' && (
                            <svg
                                className="trend-arrow"
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="12" y1="19" x2="12" y2="5" />
                                <polyline points="5 12 12 5 19 12" />
                            </svg>
                        )}
                        {resolvedTrendType === 'negative' && (
                            <svg
                                className="trend-arrow"
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <polyline points="19 12 12 19 5 12" />
                            </svg>
                        )}
                        <span className="trend-text">{displayTrend}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function MetricCardGrid({ children, columns = 4, className = '' }) {
    return <div className={`shared-metric-grid cols-${columns} ${className}`}>{children}</div>;
}

export default MetricCard;
