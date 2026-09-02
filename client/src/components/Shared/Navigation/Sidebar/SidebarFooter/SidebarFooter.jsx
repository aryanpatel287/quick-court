import { LogOut as LogoutIcon } from 'lucide-react';
import './SidebarFooter.scss';

function SidebarFooter({ onLogout }) {
    return (
        <div className="sidebar-footer-container">
            <button type="button" className="footer-btn logout-btn" onClick={onLogout}>
                <span className="footer-icon">
                    <LogoutIcon size="18" strokeWidth={2.2} />
                </span>
                <span className="footer-label">Log out</span>
            </button>
        </div>
    );
}

export default SidebarFooter;
