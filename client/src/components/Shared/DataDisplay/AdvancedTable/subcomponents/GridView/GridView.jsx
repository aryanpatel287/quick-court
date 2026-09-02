import GridCard from '../GridCard/GridCard';
import EmptyStateCard from '@/components/Shared/DataDisplay/EmptyStateCard/EmptyStateCard';
import './GridView.scss';

/**
 * GridView — Renders data as a responsive card grid.
 *
 * Props:
 *  - data             {Array}     Rows to display
 *  - columns          {Array}     Column definitions (same shape as AdvancedTable)
 *  - gridColumns      {number}    Cards per row on wide screens. Default: 4
 *  - cardTitleKey     {string}    Row key → card heading
 *  - cardSubtitleKey  {string}    Row key → card subheading
 *  - cardImageKey     {string}    Row key → avatar image URL
 *  - cardStatusKey    {string}    Row key → Badge pill
 *  - cardBodyKeys     {string[]}  Ordered row keys shown as label:value body
 *  - statusVariantMap {object}    Maps status string → Badge variant
 *  - onCardClick      {function}  (row) => void
 *  - renderCard       {function}  Full card override: (row, columns) => JSX
 *  - loading          {boolean}   Shows skeleton cards when true
 *  - skeletonCount    {number}    Number of skeleton cards. Default: 8
 */
function GridView({
    data = [],
    columns = [],
    gridColumns = 4,
    cardTitleKey,
    cardSubtitleKey,
    cardImageKey,
    cardStatusKey,
    cardBodyKeys = [],
    statusVariantMap = {},
    onCardClick,
    renderCard,
    loading = false,
    skeletonCount = 8,
}) {
    if (loading) {
        return (
            <div className="grid-view-root" style={{ '--grid-cols': gridColumns }}>
                {Array.from({ length: skeletonCount }).map((_, i) => (
                    <div key={i} className="grid-card-skeleton">
                        <div className="skeleton-avatar" />
                        <div className="skeleton-lines">
                            <div className="skeleton-line w-70" />
                            <div className="skeleton-line w-45" />
                        </div>
                        <div className="skeleton-body">
                            <div className="skeleton-line w-full" />
                            <div className="skeleton-line w-full" />
                            <div className="skeleton-line w-80" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="grid-view-empty">
                <EmptyStateCard
                    title={null}
                    subtitle={null}
                    emptyTitle="No records found"
                    emptyDescription="There are no items to display in grid view. Try adjusting your filters."
                />
            </div>
        );
    }

    return (
        <div className="grid-view-root" style={{ '--grid-cols': gridColumns }}>
            {data.map((row, idx) => (
                <GridCard
                    key={row.id ?? idx}
                    row={row}
                    columns={columns}
                    cardTitleKey={cardTitleKey}
                    cardSubtitleKey={cardSubtitleKey}
                    cardImageKey={cardImageKey}
                    cardStatusKey={cardStatusKey}
                    cardBodyKeys={cardBodyKeys}
                    statusVariantMap={statusVariantMap}
                    onClick={onCardClick}
                    renderCard={renderCard}
                />
            ))}
        </div>
    );
}

export default GridView;
