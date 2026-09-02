import { useState, useRef } from 'react';
import Tooltip from '@/components/Shared/DataDisplay/Tooltip/Tooltip';
import { useClickOutside } from '@/hooks/useClickOutside';
import {
    Settings as SettingsIcon,
    LogOut as LogoutIcon,
    Sliders as GeneralIcon,
    User as AccountIcon,
} from 'lucide-react';
import './ProfileCard.scss';

function ProfileCard({
    profile = {},
    isCollapsed = false,
    onLogoutRequest,
    onNavigateGeneral,
    onNavigateAccount,
}) {
    const {
        name = 'User',
        role = 'Member',
        username = '',
        avatarUrl = '',
        initials = 'U',
    } = profile;

    const displayRole = role || username || 'Member';
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const cardRef = useRef(null);

    useClickOutside(cardRef, () => setIsSettingsOpen(false), { enabled: isSettingsOpen });

    const avatarEl = avatarUrl ? (
        <img
            src={avatarUrl}
            alt={name}
            className="profile-avatar-img"
            style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                objectFit: 'cover',
            }}
        />
    ) : (
        <div
            className="profile-avatar-initials"
            style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light, #e0e7ff)',
                color: 'var(--color-primary, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '0.875rem',
            }}
        >
            {initials}
        </div>
    );

    const handleOpenGeneral = (e) => {
        e.stopPropagation();
        setIsSettingsOpen(false);
        if (onNavigateGeneral) onNavigateGeneral();
    };

    const handleOpenAccount = (e) => {
        e.stopPropagation();
        setIsSettingsOpen(false);
        if (onNavigateAccount) onNavigateAccount();
    };

    const handleLogout = (e) => {
        e.stopPropagation();
        setIsSettingsOpen(false);
        if (onLogoutRequest) onLogoutRequest();
    };

    const settingsPopover = isSettingsOpen && (
        <div className={`profile-settings-popover ${isCollapsed ? 'collapsed-popover' : ''}`}>
            <div className="popover-header">
                <span className="popover-title">Settings</span>
            </div>
            <div className="popover-menu">
                <button type="button" className="popover-item" onClick={handleOpenGeneral}>
                    <GeneralIcon size={16} />
                    <span>General Settings</span>
                </button>
                <button type="button" className="popover-item" onClick={handleOpenAccount}>
                    <AccountIcon size={16} />
                    <span>Account Settings</span>
                </button>
                <div className="popover-divider" />
                <button type="button" className="popover-item logout-option" onClick={handleLogout}>
                    <LogoutIcon size={16} />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );

    if (isCollapsed) {
        return (
            <div
                ref={cardRef}
                className="profile-card-container collapsed"
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                    position: 'relative',
                }}
            >
                <Tooltip content="Settings" position="right">
                    <button
                        type="button"
                        className={`profile-avatar-btn-collapsed ${isSettingsOpen ? 'active' : ''}`}
                        onClick={() => setIsSettingsOpen((prev) => !prev)}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            padding: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {avatarEl}
                    </button>
                </Tooltip>
                {settingsPopover}
            </div>
        );
    }

    return (
        <div ref={cardRef} className="profile-card-container">
            {avatarEl}

            <div className="profile-info">
                <span className="profile-name">{name}</span>
                <span className="profile-role">{displayRole}</span>
            </div>

            {/* Settings icon button inside profile card wrapped with Tooltip */}
            <Tooltip content="Settings" position="top">
                <button
                    type="button"
                    className={`profile-settings-btn ${isSettingsOpen ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsSettingsOpen((prev) => !prev);
                    }}
                >
                    <SettingsIcon size="18" strokeWidth={2.2} />
                </button>
            </Tooltip>

            {settingsPopover}
        </div>
    );
}

export default ProfileCard;
