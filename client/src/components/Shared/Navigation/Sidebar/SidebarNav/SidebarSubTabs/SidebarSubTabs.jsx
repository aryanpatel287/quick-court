import { useNavigate, useLocation } from 'react-router';
import { useActiveNavTab } from '@/hooks/useActiveNavTab';
import './SidebarSubTabs.scss';

function SidebarSubTabs({ subTabs, parentLabel, onSubTabClick }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { activeSubTab } = useActiveNavTab();

    // Resolve the role segment from the current URL
    const segments = pathname.split('/').filter(Boolean);
    const roleSegment = segments.includes('admin') ? 'admin' : 'user';

    const handleSubTabClick = (sub, e) => {
        e.stopPropagation();
        if (onSubTabClick) {
            onSubTabClick(parentLabel, sub);
            return;
        }

        const segment = sub.toLowerCase();
        if (parentLabel === 'Analytics') {
            navigate(`/dashboard/${roleSegment}/analytics/${segment}`);
        } else if (parentLabel === 'Settings') {
            navigate(`/dashboard/${roleSegment}/settings/${segment}`);
        }
    };

    const activeIndex = subTabs.indexOf(activeSubTab);

    return (
        <div className="sidebar-subtabs-list">
            {subTabs.map((sub, index) => {
                const isLast = index === subTabs.length - 1;
                const isTopLineDark = activeIndex !== -1 && index <= activeIndex;
                const isBottomLineDark = activeIndex !== -1 && index < activeIndex;

                return (
                    <div
                        key={sub}
                        className={`sidebar-subtab-item ${activeSubTab === sub ? 'active' : ''}`}
                        onClick={(e) => handleSubTabClick(sub, e)}
                    >
                        <span className={`subtab-v-line-top ${isTopLineDark ? 'dark' : ''}`} />
                        {!isLast && (
                            <span
                                className={`subtab-v-line-bottom ${isBottomLineDark ? 'dark' : ''}`}
                            />
                        )}
                        <span className="subtab-label">{sub}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default SidebarSubTabs;
