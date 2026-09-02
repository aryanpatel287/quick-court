import './Badge.scss';

function Badge({ children, variant = 'neutral', type = 'light', showDot = false, className = '' }) {
    const variantClass = `badge-${variant}`;
    const typeClass = `badge-${type}`;
    const dotClass = showDot ? 'has-dot' : '';

    return (
        <span className={`badge-container ${variantClass} ${typeClass} ${dotClass} ${className}`}>
            {showDot && <span className="badge-status-dot"></span>}
            {children}
        </span>
    );
}

export default Badge;
