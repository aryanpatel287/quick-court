import { useTheme } from '@/hooks';
import { Moon, Sun, Monitor } from 'lucide-react';
import './GeneralSettings.scss';

export default function GeneralSettings() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    return (
        <div className="general-settings-container">
            <div className="settings-card-header">
                <h2 className="settings-card-title">General Settings</h2>
                <p className="settings-card-subtitle">
                    Personalize your application theme, localization, and preferences
                </p>
            </div>

            <div className="general-settings-content">
                {/* Theme Section */}
                <div className="preference-section">
                    <div className="section-header-row">
                        <label className="section-label">Appearance Theme</label>
                        <span className="current-mode-badge">
                            Active:{' '}
                            <strong className="badge-highlight">
                                {theme === 'system'
                                    ? `System (${resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1)})`
                                    : theme.charAt(0).toUpperCase() + theme.slice(1)}
                            </strong>
                        </span>
                    </div>

                    <div className="theme-toggle-grid">
                        <button
                            type="button"
                            className={`theme-card ${theme === 'light' ? 'active' : ''}`}
                            onClick={() => setTheme('light')}
                            aria-pressed={theme === 'light'}
                        >
                            <Sun size={20} />
                            <div className="theme-info">
                                <span className="theme-name">Light</span>
                                <span className="theme-desc">Crisp white canvas</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
                            onClick={() => setTheme('dark')}
                            aria-pressed={theme === 'dark'}
                        >
                            <Moon size={20} />
                            <div className="theme-info">
                                <span className="theme-name">Dark</span>
                                <span className="theme-desc">Comfortable night mode</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            className={`theme-card ${theme === 'system' ? 'active' : ''}`}
                            onClick={() => setTheme('system')}
                            aria-pressed={theme === 'system'}
                        >
                            <Monitor size={20} />
                            <div className="theme-info">
                                <span className="theme-name">System</span>
                                <span className="theme-desc">Sync with OS style</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
