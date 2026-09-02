import './VerticalBadge.scss';

function VerticalBadge({ text = 'New', variant = 'success', className = '' }) {
    const variantClass = `vertical-badge-${variant}`;

    return (
        <div className={`vertical-badge ${variantClass} ${className}`}>
            <span className="vertical-badge-text">{text}</span>
        </div>
    );
}

export default VerticalBadge;
