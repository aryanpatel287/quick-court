import { useState, useRef } from 'react';
import Checkbox from '@/components/Shared/Form/Checkbox/Checkbox';
import Tooltip from '@/components/Shared/DataDisplay/Tooltip/Tooltip';
import {
    ChevronsUpDown as SortIcon,
    ArrowUp as ArrowUpIcon,
    ArrowDown as ArrowDownIcon,
    GripVertical as GripIcon,
} from 'lucide-react';
import './TableHeader.scss';

function TableHeader({
    selectable = false,
    showSerialNumber = false,
    isAllPageRowsSelected = false,
    handleSelectAll,
    effectiveColumns = [],
    sortConfig = {},
    handleSort,
    data = [],
    hasRows = null,
    reorderable = false,
    showColumnSorting = false,
    onColumnReorder = null,
}) {
    const [draggedKey, setDraggedKey] = useState(null);
    const [dragOverKey, setDragOverKey] = useState(null);
    const [dropDirection, setDropDirection] = useState('right');

    const draggedKeyRef = useRef(null);
    const wasDraggingRef = useRef(false);

    const handleDragStart = (e, key) => {
        draggedKeyRef.current = key;
        wasDraggingRef.current = true;
        setDraggedKey(key);
        try {
            e.dataTransfer.setData('text/plain', key);
            e.dataTransfer.effectAllowed = 'move';
        } catch (err) {
            // fallback
        }
    };

    const handleDragOver = (e, key) => {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }

        const activeSource = draggedKeyRef.current || draggedKey;
        if (!activeSource || activeSource === key) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const isLeft = e.clientX < rect.left + rect.width / 2;
        const nextDir = isLeft ? 'left' : 'right';

        if (dragOverKey !== key || dropDirection !== nextDir) {
            setDropDirection(nextDir);
            setDragOverKey(key);
        }
    };

    const handleDragLeave = (e, key) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (
            e.clientX < rect.left ||
            e.clientX >= rect.right ||
            e.clientY < rect.top ||
            e.clientY >= rect.bottom
        ) {
            if (dragOverKey === key) {
                setDragOverKey(null);
            }
        }
    };

    const handleDrop = (e, targetKey) => {
        e.preventDefault();
        e.stopPropagation();

        const sourceKey =
            draggedKeyRef.current ||
            (e.dataTransfer ? e.dataTransfer.getData('text/plain') : null) ||
            draggedKey;

        if (sourceKey && targetKey && sourceKey !== targetKey && onColumnReorder) {
            const currentKeys = effectiveColumns.map((c) => c.key);
            const sourceIndex = currentKeys.indexOf(sourceKey);
            const targetIndex = currentKeys.indexOf(targetKey);

            if (sourceIndex !== -1 && targetIndex !== -1) {
                const updatedKeys = [...currentKeys];
                const [moved] = updatedKeys.splice(sourceIndex, 1);
                let insertIndex = updatedKeys.indexOf(targetKey);
                if (dropDirection === 'right') insertIndex += 1;
                updatedKeys.splice(insertIndex, 0, moved);
                onColumnReorder(updatedKeys);
            }
        }

        draggedKeyRef.current = null;
        setDraggedKey(null);
        setDragOverKey(null);
        setTimeout(() => {
            wasDraggingRef.current = false;
        }, 100);
    };

    const handleDragEnd = () => {
        draggedKeyRef.current = null;
        setDraggedKey(null);
        setDragOverKey(null);
        setTimeout(() => {
            wasDraggingRef.current = false;
        }, 100);
    };

    const handleHeaderClick = (key, isActuallySortable) => {
        if (wasDraggingRef.current) return;
        if (isActuallySortable && handleSort) {
            handleSort(key, isActuallySortable);
        }
    };

    const checkHasRows = hasRows !== null ? hasRows : data && data.length > 0;

    return (
        <thead>
            <tr>
                {selectable && (
                    <th
                        className="advanced-table-header-cell checkbox-cell"
                        style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}
                    >
                        {checkHasRows && (
                            <Checkbox
                                id="advanced-table-select-all"
                                checked={isAllPageRowsSelected}
                                onChange={handleSelectAll}
                            />
                        )}
                    </th>
                )}
                {showSerialNumber && (
                    <th
                        className="advanced-table-header-cell serial-number-cell"
                        style={{
                            width: '56px',
                            minWidth: '56px',
                            maxWidth: '56px',
                            textAlign: 'center',
                        }}
                    >
                        #
                    </th>
                )}
                <th className="advanced-table-header-cell badge-column-header"></th>
                {effectiveColumns.map((col) => {
                    const isSorted = sortConfig.key === col.key;
                    const sortDir = isSorted ? sortConfig.direction : null;
                    const isActuallySortable =
                        showColumnSorting &&
                        col.sortable !== false &&
                        col.key !== 'action' &&
                        col.key !== 'actions' &&
                        (col.sortable === true ||
                            data.some(
                                (row) => row[col.key] !== undefined && row[col.key] !== null,
                            ));
                    const isReorderableCol =
                        reorderable && col.key !== 'action' && col.key !== 'actions';
                    const isDragging = draggedKey === col.key;
                    const isDragOver = dragOverKey === col.key;

                    const sortTooltipText =
                        sortDir === 'asc'
                            ? 'Sort descending'
                            : sortDir === 'desc'
                              ? 'Reset sort'
                              : 'Sort ascending';

                    return (
                        <th
                            key={col.key}
                            draggable={isReorderableCol}
                            onDragStart={(e) => isReorderableCol && handleDragStart(e, col.key)}
                            onDragOver={(e) => isReorderableCol && handleDragOver(e, col.key)}
                            onDragLeave={(e) => isReorderableCol && handleDragLeave(e, col.key)}
                            onDrop={(e) => isReorderableCol && handleDrop(e, col.key)}
                            onDragEnd={handleDragEnd}
                            className={`advanced-table-header-cell ${col.key}-cell ${col.className || ''} ${isActuallySortable ? 'sortable-header' : ''} ${isSorted ? 'is-sorted' : ''} ${isDragging ? 'is-dragging-column' : ''} ${isDragOver ? `drag-over-${dropDirection}` : ''}`}
                            style={{
                                width: col.width || '180px',
                                minWidth: col.width || '180px',
                                cursor: isActuallySortable ? 'pointer' : 'default',
                            }}
                            onClick={() => handleHeaderClick(col.key, isActuallySortable)}
                        >
                            <div className="header-cell-content">
                                {isReorderableCol && (
                                    <Tooltip
                                        content="Drag to reorder column"
                                        position="top"
                                        className="header-collapse-tooltip drag-handle-tooltip"
                                        usePortal
                                    >
                                        <span
                                            className="column-drag-handle"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <GripIcon size="12" strokeWidth={2.2} />
                                        </span>
                                    </Tooltip>
                                )}
                                <span>{col.label}</span>
                                {isActuallySortable && (
                                    <Tooltip
                                        content={sortTooltipText}
                                        position="top"
                                        className="header-collapse-tooltip sort-tooltip"
                                        usePortal
                                    >
                                        <span className={`sort-icon-wrapper ${sortDir || ''}`}>
                                            {sortDir === 'asc' ? (
                                                <ArrowUpIcon size="14" strokeWidth={2.8} />
                                            ) : sortDir === 'desc' ? (
                                                <ArrowDownIcon size="14" strokeWidth={2.8} />
                                            ) : (
                                                <SortIcon size="14" strokeWidth={2.8} />
                                            )}
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                        </th>
                    );
                })}
            </tr>
        </thead>
    );
}

export default TableHeader;
