import SidebarLogo from './SidebarLogo/SidebarLogo';
import SidebarNav from './SidebarNav/SidebarNav';
import ProfileCard from './ProfileCard/ProfileCard';
import './Sidebar.scss';

function Sidebar({
    isCollapsed = false,
    onToggleCollapse,
    isMobileOpen = false,
    onMobileClose,
    onLogoutRequest,
    pinnedTabs,
    onPinToggle,
    navItems = [],
    userRole = '',
    profile = {},
    onNavigateGeneral,
    onNavigateAccount,
    onItemClick,
    onSubItemClick,
    onAddItem,
}) {
    return (
        <aside
            className={`sidebar-container ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        >
            <SidebarLogo
                isCollapsed={isCollapsed}
                onToggleCollapse={onToggleCollapse}
                isMobileOpen={isMobileOpen}
                onMobileClose={onMobileClose}
            />
            <SidebarNav
                isCollapsed={isCollapsed}
                pinnedTabs={pinnedTabs}
                onPinToggle={onPinToggle}
                navItems={navItems}
                userRole={userRole}
                onItemClick={onItemClick}
                onSubItemClick={onSubItemClick}
                onAddItem={onAddItem}
            />
            <ProfileCard
                profile={profile}
                isCollapsed={isCollapsed}
                onLogoutRequest={onLogoutRequest}
                onNavigateGeneral={onNavigateGeneral}
                onNavigateAccount={onNavigateAccount}
            />
        </aside>
    );
}

export default Sidebar;
