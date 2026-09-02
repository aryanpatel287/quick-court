import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import TableTabs from '@/components/Shared/Navigation/TableTabs/TableTabs';
import Pagination from '@/components/Shared/Navigation/Pagination/Pagination';
import Tooltip from '@/components/Shared/DataDisplay/Tooltip/Tooltip';
import Button from '@/components/Shared/Buttons/Button/Button';
import ViewToggle from '@/components/Shared/Buttons/ViewToggle/ViewToggle';

import { parseDate, parseNumeric } from './utils/tableUtils';
import { useTableFilters } from './hooks/useTableFilters';
import { useTablePagination } from './hooks/useTablePagination';
import { useTableSelection } from './hooks/useTableSelection';
import { useColumnVisibility } from './hooks/useColumnVisibility';

import TableControls from './subcomponents/TableControls/TableControls';
import TableFilterChips from './subcomponents/TableFilterChips/TableFilterChips';
import TableHeader from './subcomponents/TableHeader/TableHeader';
import TableBody from './subcomponents/TableBody/TableBody';
import TableContextMenu from './subcomponents/TableContextMenu/TableContextMenu';
import TableExportMenu from './subcomponents/TableExportMenu/TableExportMenu';
import GridView from './subcomponents/GridView/GridView';

import Dialog from '@/components/Shared/Feedback/Dialog';

import './AdvancedTable.scss';

/**
 * AdvancedTable — Highly modular, configurable data table with minimal defaults.
 */
function AdvancedTable({
    columns = [],
    data = [],
    tabs = [],
    tabFilterKey = 'status',
    showTabs = null, // auto-detected from tabs.length if null
    searchable = false,
    searchPlaceholder = 'Search records...',
    searchPlaceholderPrefix = 'Search by ',
    searchOptions = null,
    searchPlaceholderInterval = 3500,
    initialRowsPerPage = 5,
    selectable = false,
    selectedRows = [],
    onSelectedRowsChange,
    onDataChange = null,
    onBulkAction = null,
    headerActions = null,
    loading = false,
    skeletonRows = null,
    serverSide = false,
    totalCount = null,
    onTableChange = null,
    onRefresh = null,
    showRefresh = false,
    showExport = false,
    onExport = null,
    filterConfig = null,
    showFilter = false,
    filterable = false,
    showSortDropdown = false,
    showColumnSorting = false,
    showSerialNumber = false,
    showRowsPerPage = false,
    showResultsCount = false,
    showPagination = true,
    enableContextMenu = false,
    showScrollButtons = false,
    className = '',

    // Column Visibility & Reorder props
    showColumnToggle = false,
    showManageColumns = false,
    enableColumnReorder = false,
    defaultHiddenColumns = [],
    visibleColumns: controlledVisibleColumns = null,
    onColumnVisibilityChange = null,
    // View mode & Grid props
    showViewToggle = false,
    viewMode: controlledViewMode = null,
    defaultViewMode = 'table',
    onViewModeChange = null,
    itemsPerPageLabel = null,
    gridColumns = 4,
    cardTitleKey,
    cardSubtitleKey,
    cardImageKey,
    cardStatusKey,
    cardBodyKeys = [],
    statusVariantMap = {},
    onCardClick,
    renderCard,
    gridSkeletonCount = 8,
}) {
    // ── View Mode state (Table vs Grid) ───────────────────────────────────────
    const [internalViewMode, setInternalViewMode] = useState(defaultViewMode);
    const activeView = controlledViewMode || internalViewMode;

    const handleViewChange = (newView) => {
        if (!controlledViewMode) setInternalViewMode(newView);
        if (onViewModeChange) onViewModeChange(newView);
    };

    const effectiveItemsPerPageLabel =
        itemsPerPageLabel || (activeView === 'grid' ? 'Cards per page' : 'Rows per page');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

    // ── Internal Editable Table Data ─────────────────────────────────────────
    const [internalData, setInternalData] = useState(data);
    const [isEditingSelected, setIsEditingSelected] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        setInternalData(data);
    }, [data]);

    // ── Auto-infer effective columns ──────────────────────────────────────────
    const effectiveColumns = useMemo(() => {
        if (Array.isArray(columns) && columns.length > 0) return columns;
        if (!internalData || internalData.length === 0) return [];
        const sample = internalData[0];
        return Object.keys(sample)
            .filter((key) => key !== 'id' && key !== '_id')
            .map((key) => {
                const label = key
                    .replace(/_/g, ' ')
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (s) => s.toUpperCase())
                    .trim();
                return { key, label, sortable: typeof sample[key] !== 'object' };
            });
    }, [columns, internalData]);

    // ── Column Reorder State (Drag and Drop) ──────────────────────────────────
    const [columnOrder, setColumnOrder] = useState([]);

    const handleColumnReorder = useCallback(
        (newOrderKeys) => {
            setColumnOrder(newOrderKeys);
            if (onTableChange) {
                onTableChange({ type: 'columnReorder', columnOrder: newOrderKeys });
            }
        },
        [onTableChange],
    );

    // Compute reordered effective columns
    const orderedEffectiveColumns = useMemo(() => {
        if (!columnOrder || columnOrder.length === 0) return effectiveColumns;
        const keyMap = new Map(effectiveColumns.map((c) => [c.key, c]));
        const ordered = [];
        columnOrder.forEach((key) => {
            if (keyMap.has(key)) {
                ordered.push(keyMap.get(key));
                keyMap.delete(key);
            }
        });
        keyMap.forEach((col) => ordered.push(col));
        return ordered;
    }, [effectiveColumns, columnOrder]);

    // ── Column Visibility hook ──────────────────────────────────────────────
    const {
        visibleColumns,
        hiddenKeys,
        columnToggleOpen,
        setColumnToggleOpen,
        columnSearchTerm,
        setColumnSearchTerm,
        columnToggleRef,
        columnToggleBtnRef,
        toggleColumn,
        showAllColumns,
        resetColumns,
    } = useColumnVisibility({
        effectiveColumns: orderedEffectiveColumns,
        defaultHiddenColumns,
        controlledVisibleColumns,
        onColumnVisibilityChange,
    });

    // ── Auto-generate filterConfig from columns if not provided ───────────────
    const effectiveFilterConfig = useMemo(() => {
        const rawConfig =
            Array.isArray(filterConfig) && filterConfig.length > 0
                ? filterConfig
                : effectiveColumns
                      .filter(
                          (col) =>
                              col.key !== 'action' &&
                              col.key !== 'actions' &&
                              col.key.toLowerCase() !== 'status' &&
                              col.key !== tabFilterKey,
                      )
                      .map((col) => {
                          const sample = internalData.find(
                              (row) =>
                                  row[col.key] !== null &&
                                  row[col.key] !== undefined &&
                                  row[col.key] !== '-' &&
                                  row[col.key] !== '',
                          );
                          if (!sample) return null;
                          const val = sample[col.key];

                          if (typeof val === 'string') {
                              const cleanedNum = String(val).replace(/[₹$€£¥\s,]/g, '');
                              if (
                                  !isNaN(parseFloat(cleanedNum)) &&
                                  cleanedNum !== '' &&
                                  !isNaN(cleanedNum)
                              ) {
                                  return { key: col.key, label: col.label, type: 'numeric' };
                              }
                              if (
                                  parseDate(val) !== null &&
                                  (String(val).includes('-') ||
                                      String(val).includes(',') ||
                                      String(val).includes('/'))
                              ) {
                                  return { key: col.key, label: col.label, type: 'date' };
                              }
                              const uniqueVals = [
                                  ...new Set(
                                      internalData
                                          .map((r) => r[col.key])
                                          .filter((v) => v !== null && v !== undefined && v !== ''),
                                  ),
                              ];
                              if (uniqueVals.length <= 20 && uniqueVals.length >= 2) {
                                  return { key: col.key, label: col.label, type: 'select' };
                              }
                          }
                          if (typeof val === 'number') {
                              return { key: col.key, label: col.label, type: 'numeric' };
                          }
                          return null;
                      })
                      .filter(Boolean);

        return rawConfig.filter(
            (fc) => fc.key.toLowerCase() !== 'status' && fc.key !== tabFilterKey,
        );
    }, [filterConfig, effectiveColumns, internalData, tabFilterKey]);

    // ── Auto-generate tabs ────────────────────────────────────────────────────
    const effectiveTabs = useMemo(() => {
        if (Array.isArray(tabs) && tabs.length > 0) return tabs;
        if (!tabFilterKey || !internalData || internalData.length === 0) return [];
        const uniqueSet = new Set();
        internalData.forEach((row) => {
            const val = row[tabFilterKey];
            if (val !== undefined && val !== null && val !== '') uniqueSet.add(String(val));
        });
        if (uniqueSet.size === 0) return [];
        const generated = [{ id: 'all', label: 'All Records' }];
        uniqueSet.forEach((val) => {
            generated.push({ id: val, label: val.charAt(0).toUpperCase() + val.slice(1) });
        });
        return generated;
    }, [tabs, internalData, tabFilterKey]);

    // ── Animated search placeholder options ───────────────────────────────────
    const autoSearchOptions = useMemo(() => {
        if (Array.isArray(searchOptions) && searchOptions.length > 0) return searchOptions;
        return effectiveColumns
            .filter(
                (col) =>
                    col.label &&
                    typeof col.label === 'string' &&
                    col.key !== 'actions' &&
                    col.key !== 'action',
            )
            .map((col) => col.label);
    }, [searchOptions, effectiveColumns]);

    // ── Unique values per column (for multi-select filter) ────────────────────
    const columnUniqueValues = useMemo(() => {
        const map = {};
        effectiveFilterConfig.forEach((fc) => {
            if (fc.type === 'select') {
                map[fc.key] = [
                    ...new Set(
                        internalData
                            .map((r) => r[fc.key])
                            .filter((v) => v !== null && v !== undefined && v !== '' && v !== '-'),
                    ),
                ].sort((a, b) => String(a).localeCompare(String(b)));
            }
        });
        return map;
    }, [effectiveFilterConfig, internalData]);

    // ── Full filter + search + sort pipeline ─────────────────────────────────
    const {
        filterPanelOpen,
        setFilterPanelOpen,
        columnFilters,
        setColumnFilters,
        dateRangeFilters,
        setDateRangeFilters,
        numericFilters,
        setNumericFilters,
        expandedFilterKey,
        filterPanelRef,
        filterToggleRef,
        toggleFilterAccordion,
        clearAllFilters,
        activeFilterCount,
        hasActiveFilters,
        activeChips,
    } = useTableFilters({
        effectiveFilterConfig,
        onFilterChange: () => setCurrentPage(1),
    });

    const isFilterActive = showFilter || filterable;

    const processedData = useMemo(() => {
        if (serverSide) return internalData;

        let result = [...internalData];

        // 1. Tab filter
        const activeTabObj = effectiveTabs.find((t) => t.id === activeTab);
        if (activeTabObj && activeTab !== 'all') {
            if (activeTabObj.filterFn) result = result.filter(activeTabObj.filterFn);
            else if (tabFilterKey)
                result = result.filter((row) => String(row[tabFilterKey]) === String(activeTab));
        }

        // 2. Text search
        if (searchable && searchTerm.trim() !== '') {
            const lowerSearch = searchTerm.toLowerCase();
            const cleanSearch = searchTerm.replace(/[₹$€£¥\s,]/g, '').toLowerCase();
            result = result.filter((row) =>
                effectiveColumns.some((col) => {
                    const val = row[col.key];
                    if (val === null || val === undefined) return false;
                    const strVal = String(val);
                    if (strVal.toLowerCase().includes(lowerSearch)) return true;
                    if (cleanSearch) {
                        const cleanVal = strVal.replace(/[₹$€£¥\s,]/g, '').toLowerCase();
                        if (cleanVal.includes(cleanSearch)) return true;
                    }
                    return false;
                }),
            );
        }

        // 3. Column multi-select filters
        if (isFilterActive) {
            Object.entries(columnFilters).forEach(([key, vals]) => {
                if (!vals || vals.length === 0) return;
                result = result.filter((row) => vals.includes(String(row[key])));
            });

            // 4. Date range filters
            Object.entries(dateRangeFilters).forEach(([key, range]) => {
                if (!range || (!range.from && !range.to)) return;
                const fromDate = range.from ? parseDate(range.from) : null;
                const toDate = range.to ? parseDate(range.to) : null;
                if (toDate) toDate.setHours(23, 59, 59, 999);

                result = result.filter((row) => {
                    const cellDate = parseDate(row[key]);
                    if (!cellDate) return false;
                    if (fromDate && cellDate < fromDate) return false;
                    if (toDate && cellDate > toDate) return false;
                    return true;
                });
            });

            // 5. Numeric range filters
            Object.entries(numericFilters).forEach(([key, range]) => {
                if (!range) return;
                const minVal =
                    range.min !== '' && range.min !== null && range.min !== undefined
                        ? parseFloat(range.min)
                        : null;
                const maxVal =
                    range.max !== '' && range.max !== null && range.max !== undefined
                        ? parseFloat(range.max)
                        : null;
                if (minVal === null && maxVal === null) return;
                result = result.filter((row) => {
                    const n = parseNumeric(row[key]);
                    if (n === null) return false;
                    if (minVal !== null && n < minVal) return false;
                    if (maxVal !== null && n > maxVal) return false;
                    return true;
                });
            });
        }

        // 6. Sorting
        if (sortConfig.key && sortConfig.direction) {
            const { key, direction } = sortConfig;
            const isAsc = direction === 'asc';
            result.sort((a, b) => {
                let valA = a[key];
                let valB = b[key];

                if (valA === undefined || valA === null || valA === '') return isAsc ? 1 : -1;
                if (valB === undefined || valB === null || valB === '') return isAsc ? -1 : 1;

                // 1. Numeric & Currency comparison
                const numA = parseNumeric(valA);
                const numB = parseNumeric(valB);
                if (numA !== null && numB !== null) {
                    return isAsc ? numA - numB : numB - numA;
                }

                // 2. Date comparison
                const dateA = parseDate(valA);
                const dateB = parseDate(valB);
                if (dateA && dateB) {
                    return isAsc
                        ? dateA.getTime() - dateB.getTime()
                        : dateB.getTime() - dateA.getTime();
                }

                // 3. String comparison
                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                return isAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
            });
        }

        return result;
    }, [
        internalData,
        effectiveColumns,
        effectiveTabs,
        activeTab,
        tabFilterKey,
        searchTerm,
        searchable,
        isFilterActive,
        sortConfig,
        serverSide,
        columnFilters,
        dateRangeFilters,
        numericFilters,
    ]);

    // ── Pagination hook ───────────────────────────────────────────────────────
    const {
        currentPage,
        setCurrentPage,
        rowsPerPage,
        totalRows,
        rowsOptions,
        totalPages,
        safeCurrentPage,
        paginatedData,
        handleRowsPerPageChange,
    } = useTablePagination({
        initialRowsPerPage,
        processedData,
        totalCount,
        serverSide,
    });

    // ── Selection hook ────────────────────────────────────────────────────────
    const { selectedIds, handleSelectRow, handleSelectAll, isAllPageRowsSelected } =
        useTableSelection({
            selectedRows,
            onSelectedRowsChange,
            paginatedData,
        });

    // Turn off edit mode if selection is cleared
    useEffect(() => {
        if (selectedIds.length === 0) {
            setIsEditingSelected(false);
        }
    }, [selectedIds.length]);

    // ── Inline Edit Handler ───────────────────────────────────────────────────
    const handleRowFieldChange = (rowId, fieldKey, newValue) => {
        setInternalData((prev) => {
            const updated = prev.map((r) => (r.id === rowId ? { ...r, [fieldKey]: newValue } : r));
            if (onDataChange) onDataChange(updated);
            return updated;
        });
    };

    // ── Bulk Actions Handlers ─────────────────────────────────────────────────
    const handleToggleEditSelected = () => {
        setIsEditingSelected((prev) => !prev);
        if (onBulkAction) onBulkAction('toggle_edit', selectedIds);
    };

    const handleSaveEdits = () => {
        setIsEditingSelected(false);
        if (onDataChange) onDataChange(internalData);
        if (onBulkAction) onBulkAction('save_edits', selectedIds, internalData);
    };

    const handleDeleteSelected = () => {
        if (selectedIds.length === 0) return;
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteSelected = () => {
        setInternalData((prev) => {
            const updated = prev.filter((r) => !selectedIds.includes(r.id));
            if (onDataChange) onDataChange(updated);
            return updated;
        });
        if (onSelectedRowsChange) onSelectedRowsChange([]);
        setIsEditingSelected(false);
        if (onBulkAction) onBulkAction('delete', selectedIds);
        setIsDeleteConfirmOpen(false);
    };

    // ── Horizontal & Grid scroll visibility ────────────────────────────────────
    const tableWrapperRef = useRef(null);
    const gridWrapperRef = useRef(null);
    const [showLeftScroll, setShowLeftScroll] = useState(false);
    const [showRightScroll, setShowRightScroll] = useState(false);

    const checkScrollable = useCallback(() => {
        const el = tableWrapperRef.current;
        if (el) {
            setShowLeftScroll(el.scrollLeft > 5);
            setShowRightScroll(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
        }
    }, []);

    useEffect(() => {
        if (showScrollButtons) {
            checkScrollable();
            window.addEventListener('resize', checkScrollable);
            return () => window.removeEventListener('resize', checkScrollable);
        }
    }, [internalData, visibleColumns, checkScrollable, showScrollButtons]);

    const handleScrollLeft = () =>
        tableWrapperRef.current?.scrollBy({ left: -250, behavior: 'smooth' });
    const handleScrollRight = () =>
        tableWrapperRef.current?.scrollBy({ left: 250, behavior: 'smooth' });

    // ── Notify parent of table change ─────────────────────────────────────────
    useEffect(() => {
        if (onTableChange) {
            onTableChange({ page: currentPage, rowsPerPage, searchTerm, activeTab, sortConfig });
        }
    }, [currentPage, rowsPerPage, searchTerm, activeTab, sortConfig, onTableChange]);

    // ── Sort handlers ─────────────────────────────────────────────────────────
    const handleSort = (columnKey, sortable) => {
        if (!sortable) return;
        setSortConfig((prev) => {
            if (prev.key === columnKey) {
                if (prev.direction === 'asc') return { key: columnKey, direction: 'desc' };
                return { key: null, direction: null };
            }
            return { key: columnKey, direction: 'asc' };
        });
        setCurrentPage(1);
    };

    const handleSortDropdownChange = (key, direction) => {
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    // ── Tab counts & tab handlers ─────────────────────────────────────────────
    const shouldRenderTabs =
        showTabs !== null
            ? showTabs
            : tabs.length > 0 || (effectiveTabs.length > 1 && tabs.length > 0);

    const tabCounts = useMemo(() => {
        const counts = {};
        effectiveTabs.forEach((tab) => {
            if (tab.id === 'all') counts[tab.id] = internalData.length;
            else if (tab.filterFn) counts[tab.id] = internalData.filter(tab.filterFn).length;
            else if (tabFilterKey)
                counts[tab.id] = internalData.filter(
                    (row) => String(row[tabFilterKey]) === String(tab.id),
                ).length;
            else counts[tab.id] = internalData.length;
        });
        return counts;
    }, [effectiveTabs, internalData, tabFilterKey]);

    const tabsWithCounts = useMemo(
        () => effectiveTabs.map((tab) => ({ ...tab, count: tabCounts[tab.id] })),
        [effectiveTabs, tabCounts],
    );

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // ── Skeleton & Refresh handling ───────────────────────────────────────────
    const selectedData = useMemo(() => {
        return internalData.filter((r) => selectedIds.includes(r.id));
    }, [internalData, selectedIds]);

    const dynamicSkeletonCount = useMemo(() => {
        if (typeof skeletonRows === 'number' && skeletonRows > 0) return skeletonRows;
        if (paginatedData.length > 0) return paginatedData.length;
        if (internalData.length > 0) return Math.min(rowsPerPage, internalData.length);
        return rowsPerPage;
    }, [skeletonRows, paginatedData.length, internalData.length, rowsPerPage]);

    const shouldUseVerticalScroll = useMemo(() => {
        if (loading) return dynamicSkeletonCount > 5;
        return paginatedData.length > 5;
    }, [loading, dynamicSkeletonCount, paginatedData.length]);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [clearedNewRowIds, setClearedNewRowIds] = useState(new Set());

    const handleRefreshClick = () => {
        setIsRefreshing(true);
        const newIds = internalData.filter((r) => r.isNew).map((r) => r.id);
        if (newIds.length > 0) setClearedNewRowIds((prev) => new Set([...prev, ...newIds]));
        if (onRefresh) onRefresh();
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const prevLoadingRef = useRef(loading);
    useEffect(() => {
        if (prevLoadingRef.current && !loading) {
            const newIds = internalData.filter((r) => r.isNew).map((r) => r.id);
            if (newIds.length > 0) setClearedNewRowIds((prev) => new Set([...prev, ...newIds]));
        }
        prevLoadingRef.current = loading;
    }, [loading, internalData]);

    // ── Context Menu & Toast handling ─────────────────────────────────────────
    const [contextMenu, setContextMenu] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    const handleToast = useCallback((msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    }, []);

    const handleCellContextMenu = useCallback(
        (e, row, col) => {
            if (!enableContextMenu) return;
            setContextMenu({
                x: e.clientX,
                y: e.clientY,
                row,
                col,
            });
        },
        [enableContextMenu],
    );

    // ── Header Actions (ViewToggle + Download Icon + Custom Actions) ─────────
    const viewToggleAction = showViewToggle ? (
        <ViewToggle view={activeView} onViewChange={handleViewChange} size="sm" />
    ) : null;

    const renderExportInHeader =
        showExport && (shouldRenderTabs || headerActions || showViewToggle);
    const hasHeaderActions =
        shouldRenderTabs || headerActions || renderExportInHeader || showViewToggle;

    const combinedHeaderActions = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderExportInHeader && visibleColumns.length > 0 && (
                <TableExportMenu
                    data={processedData}
                    columns={visibleColumns}
                    buttonVariant="icon"
                    filenamePrefix="table-export"
                    reportTitle="Data Table Report"
                    onExport={onExport}
                />
            )}
            {headerActions}
            {viewToggleAction}
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className={`advanced-table-component ${className}`}>
            {/* Tabs / Top-Right Header Actions */}
            {hasHeaderActions && (
                <TableTabs
                    tabs={shouldRenderTabs ? tabsWithCounts : []}
                    activeTab={activeTab}
                    onTabChange={handleTabClick}
                    actions={combinedHeaderActions}
                />
            )}

            {/* Controls row */}
            <TableControls
                searchable={searchable}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                searchPlaceholder={searchPlaceholder}
                searchPlaceholderPrefix={searchPlaceholderPrefix}
                autoSearchOptions={autoSearchOptions}
                searchPlaceholderInterval={searchPlaceholderInterval}
                // Filter props
                showFilter={isFilterActive}
                effectiveFilterConfig={effectiveFilterConfig}
                filterToggleRef={filterToggleRef}
                filterPanelOpen={filterPanelOpen}
                setFilterPanelOpen={setFilterPanelOpen}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={activeFilterCount}
                filterPanelRef={filterPanelRef}
                clearAllFilters={clearAllFilters}
                expandedFilterKey={expandedFilterKey}
                toggleFilterAccordion={toggleFilterAccordion}
                columnFilters={columnFilters}
                setColumnFilters={setColumnFilters}
                dateRangeFilters={dateRangeFilters}
                setDateRangeFilters={setDateRangeFilters}
                numericFilters={numericFilters}
                setNumericFilters={setNumericFilters}
                columnUniqueValues={columnUniqueValues}
                onFilterValueChange={() => setCurrentPage(1)}
                // Sort dropdown props
                showSortDropdown={showSortDropdown}
                sortConfig={sortConfig}
                onSortChange={handleSortDropdownChange}
                sortData={internalData}
                // Action props
                showRefresh={showRefresh}
                showExport={showExport && !shouldRenderTabs && !headerActions && !showViewToggle}
                exportData={processedData}
                onExport={onExport}
                isRefreshing={isRefreshing}
                loading={loading}
                handleRefreshClick={handleRefreshClick}
                // Showing results & Pagination
                showResultsCount={showResultsCount}
                totalRows={totalRows}
                safeCurrentPage={safeCurrentPage}
                rowsPerPage={rowsPerPage}
                showRowsPerPage={showRowsPerPage}
                rowsOptions={rowsOptions}
                handleRowsPerPageChange={handleRowsPerPageChange}
                itemsPerPageLabel={effectiveItemsPerPageLabel}
                // Column Toggle props
                showColumnToggle={showColumnToggle || showManageColumns}
                effectiveColumns={orderedEffectiveColumns}
                hiddenKeys={hiddenKeys}
                columnToggleOpen={columnToggleOpen}
                setColumnToggleOpen={setColumnToggleOpen}
                columnSearchTerm={columnSearchTerm}
                setColumnSearchTerm={setColumnSearchTerm}
                columnToggleRef={columnToggleRef}
                columnToggleBtnRef={columnToggleBtnRef}
                toggleColumn={toggleColumn}
                showAllColumns={showAllColumns}
                resetColumns={resetColumns}
                // Selection bar props
                selectedCount={selectedIds.length}
                selectedData={selectedData}
                isEditingSelected={isEditingSelected}
                onToggleEditSelected={handleToggleEditSelected}
                onDeleteSelected={handleDeleteSelected}
                onSaveEdits={handleSaveEdits}
            />

            {/* Active filter chips bar */}
            {isFilterActive && (
                <TableFilterChips activeChips={activeChips} clearAllFilters={clearAllFilters} />
            )}

            {/* Main content area: Grid or Table view */}
            {activeView === 'grid' ? (
                <div className="advanced-table-grid-viewport">
                    <div className="advanced-table-grid-scroll-wrapper" ref={gridWrapperRef}>
                        <GridView
                            data={paginatedData}
                            columns={visibleColumns}
                            gridColumns={gridColumns}
                            cardTitleKey={cardTitleKey}
                            cardSubtitleKey={cardSubtitleKey}
                            cardImageKey={cardImageKey}
                            cardStatusKey={cardStatusKey}
                            cardBodyKeys={cardBodyKeys}
                            statusVariantMap={statusVariantMap}
                            onCardClick={onCardClick}
                            renderCard={renderCard}
                            loading={loading}
                            skeletonCount={dynamicSkeletonCount || gridSkeletonCount}
                        />
                    </div>
                </div>
            ) : (
                <div className="advanced-table-viewport-wrapper">
                    {showScrollButtons && showLeftScroll && (
                        <Tooltip
                            content="Scroll left"
                            position="top"
                            className="scroll-arrow-tooltip left"
                        >
                            <Button
                                preset="prev"
                                onClick={handleScrollLeft}
                                aria-label="Scroll table left"
                                showText={false}
                                className="viewport-scroll-btn scroll-left"
                            />
                        </Tooltip>
                    )}
                    {showScrollButtons && showRightScroll && (
                        <Tooltip
                            content="Scroll right"
                            position="top"
                            className="scroll-arrow-tooltip right"
                        >
                            <Button
                                preset="next"
                                onClick={handleScrollRight}
                                aria-label="Scroll table right"
                                showText={false}
                                className="viewport-scroll-btn scroll-right"
                            />
                        </Tooltip>
                    )}

                    <div
                        className={`advanced-table-scroll-wrapper ${shouldUseVerticalScroll ? 'has-vertical-scroll' : ''}`}
                        ref={tableWrapperRef}
                        onScroll={showScrollButtons ? checkScrollable : undefined}
                    >
                        <table className="advanced-table-main">
                            <colgroup>
                                {selectable && <col style={{ width: '50px', minWidth: '50px' }} />}
                                {showSerialNumber && (
                                    <col style={{ width: '56px', minWidth: '56px' }} />
                                )}
                                <col style={{ width: '30px', minWidth: '30px' }} />
                                {visibleColumns.map((col) => (
                                    <col
                                        key={`col-def-${col.key}`}
                                        style={{
                                            width: col.width || '180px',
                                            minWidth: col.width || '180px',
                                        }}
                                    />
                                ))}
                            </colgroup>
                            <TableHeader
                                selectable={selectable}
                                showSerialNumber={showSerialNumber}
                                isAllPageRowsSelected={isAllPageRowsSelected}
                                handleSelectAll={handleSelectAll}
                                effectiveColumns={visibleColumns}
                                sortConfig={sortConfig}
                                handleSort={handleSort}
                                showColumnSorting={showColumnSorting}
                                data={internalData}
                                hasRows={paginatedData.length > 0}
                                reorderable={enableColumnReorder}
                                onColumnReorder={handleColumnReorder}
                            />
                            <TableBody
                                loading={loading}
                                dynamicSkeletonCount={dynamicSkeletonCount}
                                paginatedData={paginatedData}
                                selectedIds={selectedIds}
                                isEditingSelected={isEditingSelected}
                                handleSelectRow={handleSelectRow}
                                clearedNewRowIds={clearedNewRowIds}
                                effectiveColumns={visibleColumns}
                                selectable={selectable}
                                showSerialNumber={showSerialNumber}
                                safeCurrentPage={safeCurrentPage}
                                rowsPerPage={rowsPerPage}
                                searchTerm={searchTerm}
                                onRowFieldChange={handleRowFieldChange}
                                onCellContextMenu={handleCellContextMenu}
                            />
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination footer */}
            {showPagination && totalPages > 1 && (
                <div className="advanced-table-footer">
                    <Pagination
                        currentPage={safeCurrentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Context Menu for right-click copy */}
            {enableContextMenu && contextMenu && (
                <TableContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    row={contextMenu.row}
                    col={contextMenu.col}
                    effectiveColumns={effectiveColumns}
                    onClose={() => setContextMenu(null)}
                    onToast={handleToast}
                />
            )}

            {/* Copy Toast Notification */}
            {toastMessage && (
                <div className="advanced-table-toast">
                    <span className="toast-icon">✓</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Critical Delete Confirmation Dialog */}
            <Dialog
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                title="Confirm Bulk Deletion"
                variant="danger"
                size="sm"
                confirmText={`Delete ${selectedIds.length} Row${selectedIds.length > 1 ? 's' : ''}`}
                cancelText="Cancel"
                onConfirm={confirmDeleteSelected}
            >
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.5 }}>
                    Are you sure you want to permanently delete {selectedIds.length} selected item
                    {selectedIds.length > 1 ? 's' : ''}? This action is irreversible.
                </p>
            </Dialog>
        </div>
    );
}

export default AdvancedTable;
