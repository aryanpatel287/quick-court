import {
    ChevronRight as ChevronRightIcon,
    // Home as HomeIcon,
    // Briefcase as ProjectsIcon,
    // CheckSquare as TasksIcon,
    // Settings as SettingsIcon,
    // TrendingUp as AnalyticsIcon,
} from 'lucide-react';
import './Breadcrumbs.scss';

/**
 * Shared Modular Breadcrumbs Component
 * Can be used standalone or inside Topbar navigation bar.
 * Supports activeTab & activeSubTab state or a custom items array.
 */
function Breadcrumbs({
    activeTab,
    activeSubTab,
    items,
    separator = <ChevronRightIcon size={12} strokeWidth={2} />,
    className = '',
}) {
    // const getTabIcon = (tabName) => {
    //     const isBold = !activeSubTab;
    //     const stroke = isBold ? 2.6 : 1.8;
    //     const size = 16;

    //     switch (tabName) {
    //         case 'Home':
    //             return <HomeIcon size={size} strokeWidth={stroke} />;
    //         case 'Analytics':
    //             return <AnalyticsIcon size={size} strokeWidth={stroke} />;
    //         case 'Projects':
    //             return <ProjectsIcon size={size} strokeWidth={stroke} />;
    //         case 'Tasks':
    //             return <TasksIcon size={size} strokeWidth={stroke} />;
    //         case 'Settings':
    //             return <SettingsIcon size={size} strokeWidth={stroke} />;
    //         default:
    //             return null;
    //     }
    // };

    // 1. Custom Items Array mode
    if (items && items.length > 0) {
        return (
            <nav className={`shared-breadcrumbs-wrapper ${className}`} aria-label="Breadcrumb">
                <ol className="breadcrumbs-list">
                    {items.map((item, idx) => {
                        const isLast = idx === items.length - 1;
                        return (
                            <li
                                key={idx}
                                className={`breadcrumb-item ${isLast ? 'is-active' : ''}`}
                            >
                                {/* {item.icon && <span className="b/readcrumb-icon">{item.icon}</span>} */}
                                <span className="breadcrumb-label">{item.label}</span>
                                {!isLast && (
                                    <span className="breadcrumb-separator">{separator}</span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        );
    }

    // 2. Tab & SubTab Mode (Default for Topbar)
    return (
        <nav
            className={`shared-breadcrumbs-wrapper ${activeSubTab ? 'has-subtab' : ''} ${className}`}
            aria-label="Breadcrumb"
        >
            <div className="breadcrumbs-inner">
                {/* {getTabIcon(activeTab) && (
                    <span className="breadcrumb-icon">{getTabIcon(activeTab)}</span>
                )} */}
                <span className="breadcrumb-tab">{activeTab}</span>
                {activeSubTab && (
                    <>
                        <span className="breadcrumb-separator">{separator}</span>
                        <span className="breadcrumb-subtab">{activeSubTab}</span>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Breadcrumbs;
