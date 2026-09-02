import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu as MenuIcon, X as CloseIcon, Sun, Moon } from 'lucide-react';
import Button from '@/components/Shared/Buttons/Button/Button';
import Logo from '@/components/Shared/DataDisplay/Logo/Logo';
import { useTheme } from '@/hooks';

const NAV_LINKS = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Testimonials', href: '#testimonials' },
];

export default function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const [prevLocationKey, setPrevLocationKey] = useState(location.key);
    const { resolvedTheme, setTheme } = useTheme();

    if (prevLocationKey !== location.key) {
        setPrevLocationKey(location.key);
        setMobileOpen(false);
    }

    const handleToggleMobile = () => {
        setMobileOpen((prev) => !prev);
    };

    const handleCloseMobile = useCallback(() => {
        setMobileOpen(false);
    }, []);

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && mobileOpen) {
                handleCloseMobile();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mobileOpen, handleCloseMobile]);

    const handleNavClick = (e, href) => {
        if (href.startsWith('#')) {
            const targetElement = document.querySelector(href);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
                handleCloseMobile();
            }
        }
    };

    return (
        <header className="site-header" role="banner">
            <div className="header-inner">
                <Link to="/demo/website" className="header-brand" aria-label="Apex Template Home">
                    <Logo variant="full" size="md" />
                </Link>

                <nav className="desktop-nav" aria-label="Main Navigation">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="nav-link"
                            onClick={(e) => handleNavClick(e, link.href)}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="header-actions">
                    {/* Theme Toggle Button */}
                    <button
                        type="button"
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
                        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                    </button>

                    <Link to="/register" style={{ textDecoration: 'none' }}>
                        <Button variant="primary" size="sm" className="action-btn-cta">
                            Get Started
                        </Button>
                    </Link>

                    <button
                        type="button"
                        className="mobile-menu-toggle"
                        onClick={handleToggleMobile}
                        aria-expanded={mobileOpen}
                        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-controls="mobile-nav-panel"
                    >
                        {mobileOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
                    </button>
                </div>
            </div>

            <div
                id="mobile-nav-panel"
                className={`mobile-nav-panel ${mobileOpen ? 'is-open' : ''}`}
                aria-hidden={!mobileOpen}
            >
                <ul className="mobile-nav-list">
                    {NAV_LINKS.map((link) => (
                        <li key={link.href} className="mobile-nav-item">
                            <a
                                href={link.href}
                                className="mobile-nav-link"
                                onClick={(e) => handleNavClick(e, link.href)}
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </header>
    );
}
