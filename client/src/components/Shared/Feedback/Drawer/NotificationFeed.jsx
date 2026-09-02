import { useState } from 'react';
import {
    Check as CheckIcon,
    CheckCheck as CheckCheckIcon,
    Trash2 as TrashIcon,
    FileText as PageIcon,
    Folder as ProjectIcon,
    GitPullRequest as WorkflowIcon,
    MessageSquare as ThreadIcon,
    UserPlus as UserIcon,
    Sparkles as SparklesIcon,
    Layers as UsabilityIcon,
    Compass as ResearchIcon,
    BellOff as EmptyBellIcon,
    X as CloseIcon,
    Filter as FilterIcon,
} from 'lucide-react';
import SearchBar from '@/components/Shared/Form/SearchBar/SearchBar';
import TableTabs from '@/components/Shared/Navigation/TableTabs/TableTabs';
import Dropdown from '@/components/Shared/Form/Dropdown/Dropdown';
import Badge from '@/components/Shared/DataDisplay/Badge/Badge';
import Tooltip from '@/components/Shared/DataDisplay/Tooltip/Tooltip';
import Button from '@/components/Shared/Buttons/Button/Button';
import EmptyState from '@/components/Shared/DataDisplay/EmptyState/EmptyState';
import Dialog from '@/components/Shared/Feedback/Dialog';
import './NotificationFeed.scss';

/**
 * Initial notification items matching the user reference screenshot
 */
const DEFAULT_NOTIFICATIONS = [];

const TYPE_FILTER_OPTIONS = [
    { value: 'all', label: 'All Activity Types' },
    { value: 'usability', label: 'Usability Tests' },
    { value: 'user', label: 'UX / User Profile' },
    { value: 'research', label: 'Research Notes' },
    { value: 'project', label: 'Projects' },
    { value: 'workflow', label: 'Workflows' },
    { value: 'thread', label: 'Threads' },
    { value: 'page', label: 'Pages' },
    { value: 'system', label: 'System Announcements' },
];

const TIMEFRAME_FILTER_OPTIONS = [
    { value: 'all', label: 'All Timeframes' },
    { value: 'TODAY', label: 'Today' },
    { value: 'YESTERDAY', label: 'Yesterday' },
    { value: 'JUL 7', label: 'July 7 & Earlier' },
];

function NotificationFeed({
    notifications: initialNotifications,
    onNotificationClick,
    onMarkAllRead,
    onClearAll,
}) {
    const [notifications, setNotifications] = useState(
        initialNotifications || DEFAULT_NOTIFICATIONS,
    );
    const [prevInitialNotifications, setPrevInitialNotifications] = useState(initialNotifications);

    if (initialNotifications !== prevInitialNotifications) {
        setPrevInitialNotifications(initialNotifications);
        setNotifications(initialNotifications || DEFAULT_NOTIFICATIONS);
    }

    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'mentions' | 'system'
    const [searchQuery, setSearchQuery] = useState('');

    // Filter panel state using shared components
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
    const [selectedTimeframeFilter, setSelectedTimeframeFilter] = useState('all');

    // Get icon based on item type
    const getItemIcon = (type) => {
        const iconSize = 15;
        const stroke = 1.8;

        switch (type) {
            case 'usability':
                return <UsabilityIcon size={iconSize} strokeWidth={stroke} />;
            case 'user':
                return <UserIcon size={iconSize} strokeWidth={stroke} />;
            case 'research':
                return <ResearchIcon size={iconSize} strokeWidth={stroke} />;
            case 'project':
                return <ProjectIcon size={iconSize} strokeWidth={stroke} />;
            case 'workflow':
                return <WorkflowIcon size={iconSize} strokeWidth={stroke} />;
            case 'thread':
                return <ThreadIcon size={iconSize} strokeWidth={stroke} />;
            case 'page':
                return <PageIcon size={iconSize} strokeWidth={stroke} />;
            case 'system':
                return <SparklesIcon size={iconSize} strokeWidth={stroke} />;
            default:
                return <PageIcon size={iconSize} strokeWidth={stroke} />;
        }
    };

    // Toggle single notification read state
    const handleToggleRead = (id, e) => {
        e && e.stopPropagation();
        setNotifications((prev) =>
            prev.map((item) => (item.id === id ? { ...item, unread: !item.unread } : item)),
        );
    };

    // Remove single notification item
    const handleDismiss = (id, e) => {
        e && e.stopPropagation();
        setNotifications((prev) => prev.filter((item) => item.id !== id));
    };

    // Mark all notifications as read
    const handleMarkAllRead = () => {
        setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
        onMarkAllRead && onMarkAllRead();
    };

    const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

    // Clear all notifications
    const handleClearAll = () => {
        setIsConfirmClearOpen(true);
    };

    const confirmClearAll = () => {
        setNotifications([]);
        if (onClearAll) onClearAll();
        setIsConfirmClearOpen(false);
    };

    // Reset all filters
    const handleResetFilters = () => {
        setSelectedTypeFilter('all');
        setSelectedTimeframeFilter('all');
        setSearchQuery('');
    };

    // Filter notifications based on tab, type, timeframe & search query
    const filteredNotifications = notifications.filter((item) => {
        // Tab filter
        if (activeTab === 'unread' && !item.unread) return false;
        if (activeTab === 'mentions' && item.category !== 'mentions') return false;
        if (activeTab === 'system' && item.category !== 'system') return false;

        // Type filter
        if (selectedTypeFilter !== 'all' && item.type !== selectedTypeFilter) return false;

        // Timeframe filter
        if (selectedTimeframeFilter !== 'all' && item.group !== selectedTimeframeFilter)
            return false;

        // Search query filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchActor = item.actor.toLowerCase().includes(q);
            const matchAction = item.action.toLowerCase().includes(q);
            const matchTarget = item.target.toLowerCase().includes(q);
            return matchActor || matchAction || matchTarget;
        }

        return true;
    });

    // Group filtered notifications by group label ('TODAY', 'YESTERDAY', etc.)
    const groupedNotifications = filteredNotifications.reduce((acc, item) => {
        const key = item.group || 'OTHER';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const unreadCount = notifications.filter((n) => n.unread).length;
    const isFilterActive = selectedTypeFilter !== 'all' || selectedTimeframeFilter !== 'all';

    // Build TabPills configuration
    const feedTabs = [
        { id: 'all', label: 'All', count: notifications.length },
        {
            id: 'unread',
            label: 'Unread',
            count: unreadCount > 0 ? unreadCount : undefined,
            unread: unreadCount > 0,
        },
        { id: 'mentions', label: 'Mentions' },
    ];

    return (
        <div className="notification-feed-container">
            {/* Subheader Toolbar & Shared TabPills */}
            <div className="feed-toolbar">
                <TableTabs tabs={feedTabs} activeTab={activeTab} onTabChange={setActiveTab} />

                <div className="feed-header-actions">
                    {unreadCount > 0 && (
                        <Tooltip content="Mark all read" position="bottom">
                            <button
                                type="button"
                                className="feed-mark-all-read-icon-btn"
                                onClick={handleMarkAllRead}
                                aria-label="Mark all read"
                            >
                                <CheckCheckIcon size={15} strokeWidth={2.2} />
                            </button>
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* Shared SearchBar with Filter Toggle */}
            <div
                className="feed-search-box"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <SearchBar
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClear={() => setSearchQuery('')}
                    placeholder="Filter notifications..."
                />
                <button
                    type="button"
                    className={`feed-filter-toggle-btn ${isFilterActive ? 'active' : ''}`}
                    onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1px solid #e5e7eb',
                        backgroundColor: isFilterActive ? '#f3f4f6' : 'transparent',
                        color: isFilterActive ? '#111827' : '#6b7280',
                        cursor: 'pointer',
                        flexShrink: 0,
                    }}
                >
                    <FilterIcon size={14} />
                </button>
            </div>

            {/* Ultra-compact Shared Filter Panel */}
            {isFilterPanelOpen && (
                <div className="feed-filter-panel">
                    <div className="filter-panel-row">
                        <Dropdown
                            placeholder="Category..."
                            options={TYPE_FILTER_OPTIONS}
                            value={selectedTypeFilter}
                            onChange={(val) => setSelectedTypeFilter(val)}
                            className="filter-dropdown filter-dropdown-category"
                        />

                        <Dropdown
                            placeholder="Timeframe..."
                            options={TIMEFRAME_FILTER_OPTIONS}
                            value={selectedTimeframeFilter}
                            onChange={(val) => setSelectedTimeframeFilter(val)}
                            className="filter-dropdown filter-dropdown-timeframe"
                        />
                    </div>
                </div>
            )}

            {/* Slim Active Filter Badges Bar */}
            {isFilterActive && (
                <div className="active-filters-chips-bar">
                    {selectedTypeFilter !== 'all' && (
                        <Badge variant="info" type="light">
                            {TYPE_FILTER_OPTIONS.find((o) => o.value === selectedTypeFilter)?.label}
                            <CloseIcon
                                size={12}
                                className="chip-remove"
                                onClick={() => setSelectedTypeFilter('all')}
                            />
                        </Badge>
                    )}
                    {selectedTimeframeFilter !== 'all' && (
                        <Badge variant="info" type="light">
                            {
                                TIMEFRAME_FILTER_OPTIONS.find(
                                    (o) => o.value === selectedTimeframeFilter,
                                )?.label
                            }
                            <CloseIcon
                                size={12}
                                className="chip-remove"
                                onClick={() => setSelectedTimeframeFilter('all')}
                            />
                        </Badge>
                    )}
                    <Button
                        preset="cancel"
                        label="Clear"
                        size="xs"
                        onClick={handleResetFilters}
                        className="shared-chips-clear-btn"
                    />
                </div>
            )}

            {/* Notification Content Feed List */}
            <div className="feed-list-body">
                {Object.keys(groupedNotifications).length === 0 ? (
                    <EmptyState
                        variant="compact"
                        icon={EmptyBellIcon}
                        title="No notifications found"
                        description={
                            searchQuery
                                ? `No updates matching "${searchQuery}"`
                                : activeTab === 'unread'
                                  ? "You're all caught up! No unread notifications."
                                  : 'Your feed is empty.'
                        }
                    />
                ) : (
                    Object.entries(groupedNotifications).map(([groupTitle, items]) => (
                        <div key={groupTitle} className="feed-group">
                            <div className="feed-group-header">
                                <span>{groupTitle}</span>
                            </div>

                            <div className="feed-group-items">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`feed-item-card ${item.unread ? 'is-unread' : ''}`}
                                        onClick={() =>
                                            onNotificationClick && onNotificationClick(item)
                                        }
                                    >
                                        {/* Left Icon Avatar */}
                                        <div className={`item-icon-avatar type-${item.type}`}>
                                            {getItemIcon(item.type)}
                                        </div>

                                        {/* Middle Main Text Body */}
                                        <div className="item-text-body">
                                            <span className="actor-name">{item.actor}</span>{' '}
                                            <span className="action-desc">{item.action}</span>{' '}
                                            <span className="target-title">{item.target}</span>
                                        </div>

                                        {/* Right Timestamp & Hover Actions */}
                                        <div className="item-meta-right">
                                            <span className="time-ago">{item.timeAgo}</span>

                                            <div className="item-hover-actions">
                                                <button
                                                    type="button"
                                                    className="item-action-icon-btn"
                                                    title={
                                                        item.unread
                                                            ? 'Mark as read'
                                                            : 'Mark as unread'
                                                    }
                                                    onClick={(e) => handleToggleRead(item.id, e)}
                                                >
                                                    <CheckIcon
                                                        size={14}
                                                        className={item.unread ? 'highlight' : ''}
                                                    />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="item-action-icon-btn danger"
                                                    title="Dismiss"
                                                    onClick={(e) => handleDismiss(item.id, e)}
                                                >
                                                    <TrashIcon size={14} />
                                                </button>
                                            </div>

                                            {item.unread && (
                                                <span className="unread-dot" title="Unread" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Clear All Footer */}
            {notifications.length > 0 && (
                <div className="feed-footer-bar">
                    <Button
                        preset="clear-all"
                        label="Clear all notifications"
                        variant="danger"
                        size="md"
                        onClick={handleClearAll}
                    />
                </div>
            )}

            {/* Clear All Notifications Confirmation Dialog */}
            <Dialog
                isOpen={isConfirmClearOpen}
                onClose={() => setIsConfirmClearOpen(false)}
                title="Clear All Notifications"
                variant="danger"
                size="sm"
                confirmText="Clear All"
                cancelText="Cancel"
                onConfirm={confirmClearAll}
            >
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.5 }}>
                    Are you sure you want to dismiss and clear all notifications? You will not be
                    able to recover them once cleared.
                </p>
            </Dialog>
        </div>
    );
}

export default NotificationFeed;
