import React from 'react';
import Badge from '@/components/Shared/DataDisplay/Badge/Badge';
import Tooltip from '@/components/Shared/DataDisplay/Tooltip/Tooltip';
import './GridCard.scss';

/**
 * GridCard — Individual data card rendered inside GridView.
 *
 * Props:
 *  - row            {object}    Single data record
 *  - columns        {Array}     Column definitions from parent AdvancedTable
 *  - cardTitleKey   {string}    Row key used as the card heading
 *  - cardSubtitleKey{string}    Row key used as the card subheading
 *  - cardImageKey   {string}    Row key with image/avatar URL
 *  - cardStatusKey  {string}    Row key rendered as a Badge pill
 *  - cardBodyKeys   {string[]}  Row keys shown as label: value rows in body
 *  - statusVariantMap {object}  Maps status string → Badge variant. e.g. { Paid: 'success' }
 *  - onClick        {function}  (row) => void
 *  - renderCard     {function}  Full override: (row, columns) => JSX — bypasses default layout
 */
function GridCard({
    row = {},
    columns = [],
    cardTitleKey,
    cardSubtitleKey,
    cardImageKey,
    cardStatusKey,
    cardBodyKeys = [],
    statusVariantMap = {},
    onClick,
    renderCard,
}) {
    // ── Full custom render escape hatch ───────────────────────────────────────
    if (renderCard) {
        return (
            <div
                className={`grid-card-root ${onClick ? 'is-clickable' : ''}`}
                onClick={() => onClick?.(row)}
            >
                {renderCard(row, columns)}
            </div>
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getLabel = (key) => {
        const col = columns.find((c) => c.key === key);
        return col?.label || key;
    };

    const getRendered = (key) => {
        const col = columns.find((c) => c.key === key);
        const val = row[key];
        if (col?.render) {
            const rendered = col.render(val, row);
            if (React.isValidElement(rendered) && rendered.props?.children) {
                const children = React.Children.toArray(rendered.props.children);
                if (
                    children.length > 0 &&
                    (typeof children[0] === 'string' ||
                        typeof children[0] === 'number' ||
                        React.isValidElement(children[0]))
                ) {
                    return children[0];
                }
            }
            return rendered;
        }
        return val ?? '—';
    };

    const effectiveTitleKey =
        cardTitleKey ||
        columns.find(
            (c) =>
                c.key !== 'action' &&
                c.key !== 'actions' &&
                String(c.key).toLowerCase() !== 'status',
        )?.key;
    const titleVal = effectiveTitleKey ? String(row[effectiveTitleKey] ?? '—') : null;
    const subtitleVal = cardSubtitleKey ? String(row[cardSubtitleKey] ?? '—') : null;
    const imageUrl = cardImageKey ? row[cardImageKey] : null;
    const statusVal = cardStatusKey ? String(row[cardStatusKey] ?? '') : null;

    // Determine badge variant from map or common defaults
    const defaultVariants = {
        Paid: 'success',
        Active: 'success',
        Done: 'success',
        Completed: 'success',
        Due: 'warning',
        Pending: 'warning',
        'In Progress': 'warning',
        Overdue: 'danger',
        Failed: 'danger',
        Blocked: 'danger',
        Draft: 'neutral',
        Muted: 'neutral',
        Recurring: 'info',
        'On Hold': 'info',
    };
    const badgeVariant = statusVariantMap[statusVal] || defaultVariants[statusVal] || 'neutral';

    // Body key-value pairs (filter out keys used in header/status)
    const headerKeys = [effectiveTitleKey, cardSubtitleKey, cardImageKey, cardStatusKey].filter(
        Boolean,
    );
    const bodyKeys =
        cardBodyKeys.length > 0
            ? cardBodyKeys
            : columns
                  .filter(
                      (c) =>
                          !headerKeys.includes(c.key) && c.key !== 'action' && c.key !== 'actions',
                  )
                  .map((c) => c.key)
                  .slice(0, 4);

    // Action column renderer
    const actionCol = columns.find((c) => c.key === 'action' || c.key === 'actions');
    const actionRendered = actionCol?.render ? actionCol.render(row[actionCol.key], row) : null;

    return (
        <article
            className={`grid-card-root ${onClick ? 'is-clickable' : ''}`}
            onClick={() => onClick?.(row)}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(row) : undefined}
            role={onClick ? 'button' : 'article'}
            aria-label={titleVal || 'Data card'}
        >
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="grid-card-header">
                <div className="grid-card-header-text">
                    {titleVal && (
                        <Tooltip content={titleVal} position="top" usePortal>
                            <p className="grid-card-title">{titleVal}</p>
                        </Tooltip>
                    )}
                    {subtitleVal && (
                        <Tooltip content={subtitleVal} position="top" usePortal>
                            <p className="grid-card-subtitle">{subtitleVal}</p>
                        </Tooltip>
                    )}
                </div>

                {(statusVal || actionRendered) && (
                    <div className="grid-card-header-right">
                        {statusVal && (
                            <Badge variant={badgeVariant} type="light" className="grid-card-badge">
                                {statusVal}
                            </Badge>
                        )}
                        {actionRendered && (
                            <div
                                className="grid-card-action-wrapper"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {actionRendered}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Body key-value rows ─────────────────────────────────────────── */}
            {bodyKeys.length > 0 && (
                <ul className="grid-card-body">
                    {bodyKeys.map((key) => (
                        <li key={key} className="grid-card-body-row">
                            <span className="grid-card-body-label">{getLabel(key)}</span>
                            <span className="grid-card-body-value">{getRendered(key)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}

export default GridCard;
