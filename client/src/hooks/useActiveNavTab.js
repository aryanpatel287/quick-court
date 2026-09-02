import { useMemo } from 'react';
import { useLocation } from 'react-router';

/**
 * Derives { activeTab, activeSubTab } from the current URL pathname.
 * Any component that needs to know the current navigation state should call
 * this hook directly instead of receiving activeTab/activeSubTab as props.
 *
 * @returns {{ activeTab: string, activeSubTab: string }}
 */
export function useActiveNavTab() {
    const { pathname } = useLocation();

    return useMemo(() => {
        const segments = pathname.split('/').filter(Boolean);
        const dashboardIndex = segments.indexOf('dashboard');

        if (dashboardIndex === -1) {
            return { activeTab: 'Analytics', activeSubTab: 'Insight' };
        }

        let tabIndex = dashboardIndex + 1;
        if (segments[tabIndex] === 'user' || segments[tabIndex] === 'admin') {
            tabIndex++;
        }

        if (tabIndex >= segments.length) {
            return { activeTab: 'Analytics', activeSubTab: 'Insight' };
        }

        const primary = segments[tabIndex];
        const secondary = segments[tabIndex + 1];

        let activeTab = 'Analytics';
        let activeSubTab = 'Insight';

        if (primary === 'home') {
            activeTab = 'Home';
            activeSubTab = '';
        } else if (primary === 'ai') {
            activeTab = 'AI';
            activeSubTab = '';
        } else if (primary === 'analytics') {
            activeTab = 'Analytics';
            activeSubTab = secondary === 'reports' ? 'Reports' : 'Insight';
        } else if (primary === 'settings') {
            activeTab = 'Settings';
            activeSubTab = secondary === 'account' ? 'Account' : 'General';
        }

        return { activeTab, activeSubTab };
    }, [pathname]);
}
