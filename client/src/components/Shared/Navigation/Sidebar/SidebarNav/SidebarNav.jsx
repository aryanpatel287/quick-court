import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import SidebarNavItem from './SidebarNavItem/SidebarNavItem';
import SidebarSubTabs from './SidebarSubTabs/SidebarSubTabs';
import Tooltip from '@/components/Shared/DataDisplay/Tooltip/Tooltip';
import { useActiveNavTab } from '@/hooks/useActiveNavTab';
import './SidebarNav.scss';

function SidebarNav({
    isCollapsed,
    pinnedTabs: propPinnedTabs,
    onPinToggle,
    navItems = [],
    userRole = '',
    onItemClick,
    onSubItemClick,
    onAddItem,
}) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { activeTab } = useActiveNavTab();

    const [internalPinnedTabs, setInternalPinnedTabs] = useState(() => {
        try {
            const saved = localStorage.getItem('sidebar-pinned-tabs');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn(e);
            return [];
        }
    });

    const pinnedTabs = propPinnedTabs !== undefined ? propPinnedTabs : internalPinnedTabs;

    // Resolve the role segment from the current URL
    const segments = pathname.split('/').filter(Boolean);
    const roleSegment = segments.includes('admin') ? 'admin' : 'user';

    const handlePinToggle = (label) => {
        let nextPinned;
        if (pinnedTabs.includes(label)) {
            nextPinned = pinnedTabs.filter((item) => item !== label);
        } else {
            nextPinned = [...pinnedTabs, label];
        }

        if (onPinToggle) {
            onPinToggle(label, nextPinned);
        } else {
            setInternalPinnedTabs(nextPinned);
            try {
                localStorage.setItem('sidebar-pinned-tabs', JSON.stringify(nextPinned));
            } catch (e) {
                console.warn(e);
            }
        }
    };

    const handleItemClick = (item) => {
        if (onItemClick) {
            onItemClick(item);
            return;
        }

        // Default navigation fallback
        const label = typeof item === 'string' ? item : item.label;
        if (item.path) {
            navigate(item.path);
            return;
        }

        switch (label) {
            case 'Home':
                navigate(`/dashboard/${roleSegment}/home`);
                break;
            case 'AI':
                navigate(`/dashboard/${roleSegment}/ai`);
                break;
            case 'Analytics':
                navigate(`/dashboard/${roleSegment}/analytics/insight`);
                break;
            case 'Settings':
                navigate(`/dashboard/${roleSegment}/settings/general`);
                break;
            default:
                navigate(`/dashboard/${roleSegment}`);
        }
    };

    const handleAddItem = (label) => {
        if (onAddItem) {
            onAddItem(label);
        } else {
            alert(`Add item clicked for: ${label}`);
        }
    };

    // Filter nav items by userRole prop (pure presentation, no context coupling)
    const normalizedUserRole = userRole.toLowerCase();
    const authorizedNavItems = navItems.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        if (!normalizedUserRole) return true;
        return item.roles.some((role) => role.toLowerCase() === normalizedUserRole);
    });

    // Sort nav items so pinned tabs appear at the top
    const sortedNavItems = [...authorizedNavItems].sort((a, b) => {
        const aPinned = pinnedTabs.includes(a.label);
        const bPinned = pinnedTabs.includes(b.label);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
    });

    return (
        <nav className="sidebar-nav-container">
            {sortedNavItems.map((item) => {
                const isActive = activeTab === item.label;
                const isPinned = pinnedTabs.includes(item.label);

                return (
                    <div
                        key={item.label}
                        className={`sidebar-nav-item-wrapper ${item.subTabs ? 'has-subtabs' : ''} ${isActive ? 'is-active-tab' : ''} ${isPinned ? 'is-pinned-tab' : ''}`}
                    >
                        <Tooltip
                            content={
                                isCollapsed && !item.subTabs
                                    ? isPinned
                                        ? `${item.label} (Pinned)`
                                        : item.label
                                    : ''
                            }
                            position="right"
                            className="sidebar-tooltip-wrapper"
                        >
                            <SidebarNavItem
                                label={item.label}
                                icon={item.icon}
                                isActive={isActive}
                                showAdd={item.showAdd && !isCollapsed}
                                onClick={() => handleItemClick(item)}
                                onAddClick={() => handleAddItem(item.label)}
                                isPinned={isPinned}
                                onPinClick={() => handlePinToggle(item.label)}
                            />
                        </Tooltip>
                        {item.subTabs && (isCollapsed || isActive) && (
                            <SidebarSubTabs
                                subTabs={item.subTabs}
                                parentLabel={item.label}
                                onSubTabClick={onSubItemClick}
                            />
                        )}
                    </div>
                );
            })}
        </nav>
    );
}

export default SidebarNav;
