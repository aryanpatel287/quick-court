import { Link } from 'react-router';
import { Github, Twitter, Linkedin, MessageSquare, ArrowUpRight } from 'lucide-react';
import Logo from '@/components/Shared/DataDisplay/Logo/Logo';
import '../styles/footer.scss';

const PRODUCT_LINKS = [
    { label: 'Features', href: '#features', isAnchor: true },
    { label: 'Pricing', href: '#pricing', isAnchor: true },
    { label: 'Testimonials', href: '#testimonials', isAnchor: true },
    { label: 'UI Showcase', href: '/showcase', isRoute: true },
    { label: 'AI Copilot Demo', href: '/demo/copilot', isRoute: true },
    { label: 'Documentation', href: '#', isExternal: false },
    { label: 'Changelog', href: '#', isExternal: false },
];

const RESOURCE_LINKS = [
    { label: 'Getting Started Guide', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'Architecture Patterns', href: '#' },
    { label: 'Community Discord', href: 'https://discord.com', isExternal: true },
    { label: 'Support & Help Desk', href: '#' },
];

const COMPANY_LINKS = [
    { label: 'About Us', href: '#' },
    { label: 'Careers (We’re hiring!)', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Security Overview', href: '#' },
];

const SOCIAL_LINKS = [
    { label: 'GitHub', href: 'https://github.com', icon: Github },
    { label: 'Twitter', href: 'https://twitter.com', icon: Twitter },
    { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
    { label: 'Community Discord', href: 'https://discord.com', icon: MessageSquare },
];

export default function Footer() {
    const handleAnchorClick = (e, href) => {
        if (href.startsWith('#')) {
            const targetElement = document.querySelector(href);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <footer className="website-footer" role="contentinfo" aria-label="Site Footer">
            <div className="footer-container">
                {/* 4-Column Responsive Grid */}
                <div className="footer-main-grid">
                    {/* Column 1: Brand & Status */}
                    <div className="footer-col footer-col-brand">
                        <Link
                            to="/demo/website"
                            className="footer-brand-link"
                            aria-label="Apex Template Home"
                        >
                            <Logo variant="full" size="md" />
                        </Link>

                        <p className="footer-mission">
                            The modern full-stack boilerplate engineered for speed, clean SCSS
                            architecture, and native AI integration. Build and launch 10x faster.
                        </p>

                        {/* Live Operational Status Indicator */}
                        <div
                            className="system-status-indicator"
                            aria-label="System operational status"
                        >
                            <span className="status-dot-pulse" aria-hidden="true" />
                            <span className="status-text">All systems operational</span>
                        </div>
                    </div>

                    {/* Column 2: Product */}
                    <div className="footer-col">
                        <h4 className="footer-col-title">Product</h4>
                        <ul className="footer-links-list">
                            {PRODUCT_LINKS.map((link) => (
                                <li key={link.label} className="footer-link-item">
                                    {link.isRoute ? (
                                        <Link to={link.href} className="footer-link">
                                            {link.label}
                                        </Link>
                                    ) : link.isAnchor ? (
                                        <a
                                            href={link.href}
                                            className="footer-link"
                                            onClick={(e) => handleAnchorClick(e, link.href)}
                                        >
                                            {link.label}
                                        </a>
                                    ) : (
                                        <a href={link.href} className="footer-link">
                                            {link.label}
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Resources */}
                    <div className="footer-col">
                        <h4 className="footer-col-title">Resources</h4>
                        <ul className="footer-links-list">
                            {RESOURCE_LINKS.map((link) => (
                                <li key={link.label} className="footer-link-item">
                                    <a
                                        href={link.href}
                                        className="footer-link"
                                        target={link.isExternal ? '_blank' : undefined}
                                        rel={link.isExternal ? 'noopener noreferrer' : undefined}
                                    >
                                        <span>{link.label}</span>
                                        {link.isExternal && (
                                            <ArrowUpRight
                                                size={12}
                                                className="external-link-icon"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: Company & Legal */}
                    <div className="footer-col">
                        <h4 className="footer-col-title">Company & Legal</h4>
                        <ul className="footer-links-list">
                            {COMPANY_LINKS.map((link) => (
                                <li key={link.label} className="footer-link-item">
                                    <a href={link.href} className="footer-link">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar: Copyright, Version & Social Links */}
                <div className="footer-bottom-bar">
                    <div className="bottom-left">
                        <span className="copyright-text">
                            © {new Date().getFullYear()} Apex Template. Released under the MIT
                            License.
                        </span>
                        <span className="version-tag" title="Template Version">
                            v2.0.0
                        </span>
                    </div>

                    <div className="bottom-socials" aria-label="Social media links">
                        {SOCIAL_LINKS.map((social) => {
                            const SocialIcon = social.icon;
                            return (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    className="social-icon-btn"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    title={social.label}
                                >
                                    <SocialIcon size={16} />
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </footer>
    );
}
