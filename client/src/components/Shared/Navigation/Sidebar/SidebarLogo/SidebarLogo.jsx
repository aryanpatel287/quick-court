import { PanelLeftClose, PanelLeftOpen, X as CloseIcon } from 'lucide-react';
import Tooltip from '@/components/Shared/DataDisplay/Tooltip/Tooltip';
import './SidebarLogo.scss';

function SidebarLogo({ isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose }) {
    return (
        <div className="sidebar-logo-wrapper">
            {isCollapsed ? (
                <>
                    <div className="collapsed-expand-only">
                        <Tooltip
                            content="Expand sidebar"
                            position="right"
                            className="sidebar-tooltip-wrapper"
                        >
                            <button
                                type="button"
                                className="sidebar-toggle-btn collapsed-expand-btn"
                                onClick={onToggleCollapse}
                                aria-label="Expand sidebar"
                            >
                                <PanelLeftOpen size={20} />
                            </button>
                        </Tooltip>
                    </div>
                </>
            ) : (
                <>
                    {isMobileOpen && onMobileClose ? (
                        <button
                            type="button"
                            className="sidebar-close-btn"
                            onClick={onMobileClose}
                            aria-label="Close sidebar"
                        >
                            <CloseIcon size={18} />
                        </button>
                    ) : (
                        <Tooltip content="Collapse sidebar" position="left">
                            <button
                                type="button"
                                className="sidebar-toggle-btn"
                                onClick={onToggleCollapse}
                                aria-label="Collapse sidebar"
                            >
                                <PanelLeftClose size={16} />
                            </button>
                        </Tooltip>
                    )}
                </>
            )}
        </div>
    );
}

export default SidebarLogo;
