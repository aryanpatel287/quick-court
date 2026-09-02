import { LayoutList, LayoutGrid } from 'lucide-react';
import Tooltip from '@/components/Shared/DataDisplay/Tooltip/Tooltip';
import './ViewToggle.scss';

/**
 * ViewToggle — Segmented view-mode switcher between Table and Grid.
 *
 * Props:
 *  - view        {'table'|'grid'}        Currently active view
 *  - onViewChange {function}             (newView: 'table'|'grid') => void
 *  - tableLabel   {string}              Tooltip/aria label for table button. Default: 'Table view'
 *  - gridLabel    {string}              Tooltip/aria label for grid button. Default: 'Grid view'
 *  - size         {'sm'|'md'}           Control size. Default: 'md'
 *  - position     {'top'|'bottom'|'left'|'right'} Tooltip position. Default: 'bottom'
 *  - className    {string}              Extra class names on root
 */
function ViewToggle({
    view = 'table',
    onViewChange,
    tableLabel = 'Table view',
    gridLabel = 'Grid view',
    size = 'md',
    position = 'top',
    className = '',
}) {
    const iconSize = size === 'sm' ? 14 : 16;

    return (
        <div
            className={`view-toggle-group size-${size} ${className}`}
            role="group"
            aria-label="View mode"
        >
            <Tooltip content={tableLabel} position={position} usePortal>
                <button
                    type="button"
                    className={`view-toggle-btn ${view === 'table' ? 'is-active' : ''}`}
                    onClick={() => onViewChange?.('table')}
                    aria-label={tableLabel}
                    aria-pressed={view === 'table'}
                >
                    <LayoutList size={iconSize} strokeWidth={2} />
                </button>
            </Tooltip>

            <Tooltip content={gridLabel} position={position} usePortal>
                <button
                    type="button"
                    className={`view-toggle-btn ${view === 'grid' ? 'is-active' : ''}`}
                    onClick={() => onViewChange?.('grid')}
                    aria-label={gridLabel}
                    aria-pressed={view === 'grid'}
                >
                    <LayoutGrid size={iconSize} strokeWidth={2} />
                </button>
            </Tooltip>
        </div>
    );
}

export default ViewToggle;
